import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

/**
 * ThemePullChain — a physically-simulated stage-light pull cord (top-right).
 *
 * The cord is a Verlet chain: each bead integrates velocity + gravity and is
 * held to its neighbours by per-frame distance constraints, so it hangs, gets
 * dragged, snaps, and pendulums to rest like real string (not jelly). Pulling
 * the handle DOWN past a threshold and releasing fires the toggle on the
 * "snap"; sideways grazes and short tugs don't. The toggle drives the app's
 * canonical theme (useTheme → "clio-theme"), with an instant icon/colour
 * change plus a synthesised click and a haptic tick.
 *
 * Accessibility: the handle is a real <button>. Click and Enter/Space always
 * toggle — the drag is pure enhancement. Under prefers-reduced-motion the
 * simulation is skipped entirely and the toggle is instant.
 *
 * Rendering is imperative: a single requestAnimationFrame loop (fixed
 * timestep) writes bead/cord/handle positions straight to the DOM via refs, so
 * React never re-renders during a swing. Only the small icon subtree re-renders
 * on theme change, and no geometry is a JSX prop, so positions are never
 * clobbered.
 */

// ── geometry (SVG-local px; the container is exactly W×H) ──
const W = 56
const H = 188
const ANCHOR_X = W / 2
const ANCHOR_Y = 10
const REST_Y = 104 // handle's resting centre — clears the nav pill (~76px tall)
const POINTS = 7 // anchor (0) + 5 beads + handle (6)
const HANDLE = POINTS - 1
const SEG = (REST_Y - ANCHOR_Y) / (POINTS - 1)

// ── physics ──
const GRAVITY = 0.5 // px / step²
const FRICTION = 0.98 // velocity retained per step (damping)
const ITER = 16 // constraint relaxation passes per step
const STEP_MS = 1000 / 60 // fixed simulation timestep
const MAX_SUBSTEPS = 5
const SETTLE_V = 0.05 // speed under which a bead counts as at rest
const SETTLE_FRAMES = 12

// ── interaction ──
const TAP_SLOP = 6 // px of movement that still counts as a tap
const TAP_MS = 260
const PULL_THRESHOLD = 30 // downward px past rest that counts as a deliberate pull
const TUG_IMPULSE = 16 // downward velocity injected on tap / keyboard activation

type Point = { x: number; y: number; ox: number; oy: number; tx: number; ty: number }
type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> }
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)
const htmlIsDark = () =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark")

function makePoints(): Point[] {
  const pts: Point[] = []
  for (let i = 0; i < POINTS; i++) {
    const y = ANCHOR_Y + SEG * i
    pts.push({ x: ANCHOR_X, y, ox: ANCHOR_X, oy: y, tx: ANCHOR_X, ty: y })
  }
  return pts
}

export function ThemePullChain() {
  const { setTheme } = useTheme()
  const reduceMotionRef = useRef(false)
  const [isDark, setIsDark] = useState(htmlIsDark)

  // DOM refs (geometry is written imperatively; never via JSX props)
  const containerRef = useRef<HTMLDivElement>(null)
  const cordRef = useRef<SVGPolylineElement>(null)
  const beadRefs = useRef<(SVGCircleElement | null)[]>([])
  const handleRef = useRef<HTMLButtonElement>(null)

  // simulation state (refs — the rAF loop must not depend on React renders)
  const ptsRef = useRef<Point[]>(makePoints())
  const rafRef = useRef<number | null>(null)
  const runningRef = useRef(false)
  const lastRef = useRef(0)
  const accRef = useRef(0)
  const settleRef = useRef(0)
  const maxVRef = useRef(0)
  const dragRef = useRef({ active: false, id: -1, sx: 0, sy: 0, st: 0, moved: false })
  const audioRef = useRef<AudioContext | null>(null)

  // ── render: push simulated positions to the DOM ──
  const render = useCallback(() => {
    const pts = ptsRef.current
    let pointsAttr = ""
    for (const p of pts) pointsAttr += `${p.x.toFixed(2)},${p.y.toFixed(2)} `
    cordRef.current?.setAttribute("points", pointsAttr.trim())
    const beads = beadRefs.current
    for (let i = 0; i < beads.length; i++) {
      const p = pts[i + 1]
      const c = beads[i]
      if (c && p) {
        c.setAttribute("cx", p.x.toFixed(2))
        c.setAttribute("cy", p.y.toFixed(2))
      }
    }
    const h = pts[HANDLE]
    if (handleRef.current) {
      handleRef.current.style.transform = `translate(${h.x.toFixed(2)}px, ${h.y.toFixed(2)}px) translate(-50%, -50%)`
    }
  }, [])

  // ── one fixed simulation step (Verlet integrate + constraint relaxation) ──
  const simulate = useCallback(() => {
    const pts = ptsRef.current
    const drag = dragRef.current
    let maxV = 0

    for (let i = 1; i < pts.length; i++) {
      const p = pts[i]
      if (i === HANDLE && drag.active) {
        // pinned to the pointer; old position lags one frame so release keeps velocity
        p.ox = p.x
        p.oy = p.y
        p.x = p.tx
        p.y = p.ty
        continue
      }
      const vx = (p.x - p.ox) * FRICTION
      const vy = (p.y - p.oy) * FRICTION
      const sp = vx * vx + vy * vy
      if (sp > maxV) maxV = sp
      p.ox = p.x
      p.oy = p.y
      p.x += vx
      p.y += vy + GRAVITY
    }

    for (let k = 0; k < ITER; k++) {
      const a0 = pts[0]
      a0.x = ANCHOR_X
      a0.y = ANCHOR_Y
      if (drag.active) {
        const hp = pts[HANDLE]
        hp.x = hp.tx
        hp.y = hp.ty
      }
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]
        const b = pts[i + 1]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.hypot(dx, dy) || 0.0001
        const diff = ((SEG - dist) / dist) * 0.5
        const ox = dx * diff
        const oy = dy * diff
        const aPinned = i === 0 || (i === HANDLE && drag.active)
        const bPinned = i + 1 === HANDLE && drag.active
        if (!aPinned) {
          a.x -= ox
          a.y -= oy
        }
        if (!bPinned) {
          b.x += ox
          b.y += oy
        }
      }
    }

    // keep beads inside the container so a hard yank can't fling them off-canvas
    for (let i = 1; i < pts.length; i++) {
      pts[i].x = clamp(pts[i].x, 4, W - 4)
      pts[i].y = clamp(pts[i].y, ANCHOR_Y, H - 4)
    }
    maxVRef.current = Math.sqrt(maxV)
  }, [])

  const loop = useCallback(
    (now: number) => {
      const frame = Math.min(now - lastRef.current, 80)
      lastRef.current = now
      accRef.current += frame
      let steps = 0
      while (accRef.current >= STEP_MS && steps < MAX_SUBSTEPS) {
        simulate()
        accRef.current -= STEP_MS
        steps++
      }
      render()

      if (!dragRef.current.active && maxVRef.current < SETTLE_V) {
        settleRef.current++
      } else {
        settleRef.current = 0
      }
      if (settleRef.current > SETTLE_FRAMES && !dragRef.current.active) {
        runningRef.current = false
        rafRef.current = null
        return
      }
      rafRef.current = requestAnimationFrame(loop)
    },
    [simulate, render]
  )

  const ensureRunning = useCallback(() => {
    if (runningRef.current || reduceMotionRef.current) return
    runningRef.current = true
    settleRef.current = 0
    lastRef.current = performance.now()
    accRef.current = 0
    rafRef.current = requestAnimationFrame(loop)
  }, [loop])

  // ── feedback: a short synthesised "click" (no audio asset needed) ──
  const playClick = useCallback(() => {
    try {
      const Ctor =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      let ctx = audioRef.current
      if (!ctx) {
        ctx = new Ctor()
        audioRef.current = ctx
      }
      if (ctx.state === "suspended") void ctx.resume()
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "square"
      osc.frequency.setValueAtTime(170, t)
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.05)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.06, t + 0.004)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.08)
    } catch {
      /* audio is best-effort */
    }
  }, [])

  // ── theme commit + premium circular reveal from the handle ──
  const reveal = useCallback(() => {
    const el = handleRef.current
    if (!el) return
    const { left, top, width, height } = el.getBoundingClientRect()
    const cx = left + width / 2
    const cy = top + height / 2
    const r = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy))
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${r}px at ${cx}px ${cy}px)`] },
      { duration: 620, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" }
    )
  }, [])

  const doToggle = useCallback(
    (withTug: boolean) => {
      playClick()
      try {
        navigator.vibrate?.(8)
      } catch {
        /* haptics best-effort */
      }
      const next = htmlIsDark() ? "light" : "dark"
      const commit = () => {
        const root = document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(next)
        setTheme(next) // canonical persistence (clio-theme) + context sync
      }
      const vtDoc = document as ViewTransitionDoc
      if (reduceMotionRef.current || !vtDoc.startViewTransition) {
        commit()
      } else {
        vtDoc
          .startViewTransition(() => flushSync(commit))
          .ready.then(reveal)
          .catch(() => {})
      }
      if (withTug && !reduceMotionRef.current) {
        const h = ptsRef.current[HANDLE]
        h.oy = h.y - TUG_IMPULSE // inject downward velocity → visible tug + recoil
        ensureRunning()
      }
    },
    [playClick, reveal, setTheme, ensureRunning]
  )

  // ── pointer (drag) input ──
  const localPoint = (e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (reduceMotionRef.current) return // click handler covers activation
    const { x, y } = localPoint(e)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* capture best-effort */
    }
    dragRef.current = { active: true, id: e.pointerId, sx: x, sy: y, st: performance.now(), moved: false }
    const h = ptsRef.current[HANDLE]
    h.tx = clamp(x, 6, W - 6)
    h.ty = clamp(y, ANCHOR_Y + SEG, H - 6)
    ensureRunning()
  }, [ensureRunning])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current
    if (!d.active || e.pointerId !== d.id) return
    const { x, y } = localPoint(e)
    if (Math.hypot(x - d.sx, y - d.sy) > TAP_SLOP) d.moved = true
    const h = ptsRef.current[HANDLE]
    h.tx = clamp(x, 6, W - 6)
    h.ty = clamp(y, ANCHOR_Y + SEG, H - 6)
  }, [])

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const d = dragRef.current
      if (!d.active || e.pointerId !== d.id) return
      d.active = false
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* release best-effort */
      }
      const dt = performance.now() - d.st
      const dy = ptsRef.current[HANDLE].ty - REST_Y // downward displacement at release
      if (!d.moved && dt < TAP_MS) {
        doToggle(true) // tap
      } else if (dy > PULL_THRESHOLD) {
        doToggle(false) // deliberate downward pull — snap; chain keeps its velocity
      }
      ensureRunning() // let the chain swing/settle from wherever it was released
    },
    [doToggle, ensureRunning]
  )

  const onPointerCancel = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current
    if (!d.active || e.pointerId !== d.id) return
    d.active = false
    ensureRunning()
  }, [ensureRunning])

  // keyboard (Enter/Space fire a click with detail 0); also the reduced-motion path
  const onClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (reduceMotionRef.current) {
        doToggle(false)
        return
      }
      if (e.detail === 0) doToggle(true) // keyboard only (pointer taps handled in onPointerUp)
    },
    [doToggle]
  )

  // ── lifecycle ──
  useLayoutEffect(() => {
    render() // position everything before first paint (no JSX geometry → no flash)
  }, [render])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const setRM = () => {
      reduceMotionRef.current = mq.matches
    }
    setRM()
    mq.addEventListener("change", setRM)
    return () => mq.removeEventListener("change", setRM)
  }, [])

  useEffect(() => {
    const sync = () => setIsDark(htmlIsDark())
    const obs = new MutationObserver(sync)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      runningRef.current = false
      void audioRef.current?.close()
    }
  }, [])

  const label = isDark ? "Switch to light mode" : "Switch to dark mode"

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed top-0 right-3 z-40 sm:right-5"
      style={{ width: W, height: H }}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${W} ${H}`}
        fill="none"
        aria-hidden="true"
      >
        {/* ceiling mount */}
        <circle cx={ANCHOR_X} cy={ANCHOR_Y} r={3} fill="var(--border-strong)" />
        {/* cord */}
        <polyline
          ref={cordRef}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* beads (points 1..HANDLE-1) */}
        {Array.from({ length: POINTS - 2 }).map((_, i) => (
          <circle
            key={i}
            ref={(el) => {
              beadRefs.current[i] = el
            }}
            r={1.9}
            fill="var(--text-muted)"
          />
        ))}
      </svg>

      <button
        ref={handleRef}
        type="button"
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        aria-label="Dark mode"
        aria-pressed={isDark}
        title={label}
        className="group pointer-events-auto absolute left-0 top-0 flex h-9 w-9 cursor-grab touch-none select-none items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-raised)] shadow-[0_6px_16px_-8px_rgba(20,19,15,0.45)] outline-none transition-[box-shadow] duration-300 active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] dark:shadow-[0_0_0_1px_rgba(255,106,77,0.35),0_8px_22px_-6px_rgba(255,106,77,0.5)]"
      >
        <span className="relative flex h-4 w-4 items-center justify-center transition-transform duration-150 group-hover:scale-110 group-active:scale-90">
          <Moon
            size={16}
            strokeWidth={1.9}
            className={`absolute text-[var(--text-primary)] transition-all duration-300 ${
              isDark ? "scale-50 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
            }`}
          />
          <Sun
            size={16}
            strokeWidth={1.9}
            className={`absolute text-[var(--ember)] transition-all duration-300 ${
              isDark ? "scale-100 rotate-0 opacity-100" : "scale-50 rotate-90 opacity-0"
            }`}
          />
        </span>
      </button>
    </div>
  )
}
