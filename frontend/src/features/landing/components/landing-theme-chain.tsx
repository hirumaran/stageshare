import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { useTheme } from "@/components/theme-provider"

/**
 * ThemePullChain — a physically-simulated pull-chain lamp (top-right).
 *
 * The cord is a Verlet chain: each bead integrates velocity + gravity and is
 * held to its neighbours by per-frame distance constraints, so it hangs, gets
 * dragged, snaps, and pendulums to rest like real string (not jelly). A
 * stylised incandescent BULB hangs off the end — its brass socket meets the
 * cord, the glass envelope hangs below. Pulling the handle DOWN past a
 * threshold and releasing fires the toggle on the "snap"; sideways grazes and
 * short tugs don't. Hovering injects a gentle horizontal "breeze" so the bulb
 * sways ~1–2° and the cord follows.
 *
 * The toggle drives the app's canonical theme (useTheme). Light mode = bulb ON
 * (warm glass, filament, sun, four glow layers, a circular page-illumination
 * reveal); dark mode = bulb OFF (matte pewter glass, crescent moon, no
 * emission). The ON/OFF look is driven purely by the html.dark / html:not(.dark)
 * class (see the .bulb-* block in index.css) — so the bulb lights as a
 * consequence of the same class flip that repaints the page, plus a synthesised
 * click and a haptic tick.
 *
 * Accessibility: the handle is a real <button>. Click and Enter/Space always
 * toggle — the drag is pure enhancement. Under prefers-reduced-motion the
 * simulation (and the breeze) is skipped, glow cross-fades instantly, and the
 * toggle is instant.
 *
 * Rendering is imperative: a single requestAnimationFrame loop (fixed
 * timestep) writes bead/cord/handle positions straight to the DOM via refs, so
 * React never re-renders during a swing. The bulb's ON/OFF crossfade is CSS,
 * and no geometry is a JSX prop, so positions are never clobbered.
 */

// ── geometry (SVG-local px; the container is exactly W×H) ──
const W = 56
const H = 188
const ANCHOR_X = W / 2
const ANCHOR_Y = 10
const REST_Y = 104 // resting Y of the cord terminus (bulb's socket cap) — bulb hangs below, clearing the nav pill
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

// ── hover sway ──
const HOVER_BREEZE = 0.012 // horizontal wind accel injected while hovering → gentle ~1–2° sway
const HOVER_PERIOD = 420 // ms per radian of the hover sway oscillation (~2.6s full cycle)

// ── bulb geometry ──
// The cord terminates at the socket-cap collar (bulb-SVG y≈2), so the handle's
// imperative transform anchors the button's TOP (not its centre) to pts[HANDLE].
const SOCKET_ANCHOR = 2 // px from the button's top edge down to the cord terminus

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
  const hoverRef = useRef(false) // pointer is over the bulb → apply the sway breeze
  const windRef = useRef(0) // per-frame horizontal breeze accel (0 unless hovering)
  const wrapRef = useRef<HTMLSpanElement>(null) // bulb wrapper — carries the "clunk" seat

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
      // anchor the button's TOP edge (socket cap) to the cord terminus, so the
      // cord meets the bulb's collar and the glass hangs below.
      handleRef.current.style.transform = `translate(${h.x.toFixed(2)}px, ${h.y.toFixed(2)}px) translate(-50%, -${SOCKET_ANCHOR}px)`
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
      p.x += vx + windRef.current // hover breeze (0 unless hovering): gentle horizontal sway
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
      // gentle hover sway: a small oscillating horizontal "wind" the chain follows.
      windRef.current =
        hoverRef.current && !dragRef.current.active && !reduceMotionRef.current
          ? HOVER_BREEZE * Math.sin(now / HOVER_PERIOD)
          : 0
      let steps = 0
      while (accRef.current >= STEP_MS && steps < MAX_SUBSTEPS) {
        simulate()
        accRef.current -= STEP_MS
        steps++
      }
      render()

      if (!dragRef.current.active && !hoverRef.current && maxVRef.current < SETTLE_V) {
        settleRef.current++
      } else {
        settleRef.current = 0
      }
      // never park the loop while hovering — the breeze must keep swaying the bulb.
      if (settleRef.current > SETTLE_FRAMES && !dragRef.current.active && !hoverRef.current) {
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
      // mechanical "clunk": a 1-shot scale seat on the bulb (restarted via reflow).
      const wrap = wrapRef.current
      if (wrap && !reduceMotionRef.current) {
        wrap.classList.remove("bulb-clunk")
        void wrap.offsetWidth
        wrap.classList.add("bulb-clunk")
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

  // hover: a gentle breeze sways the bulb (and the cord follows). Pure enhancement.
  const onPointerEnter = useCallback(() => {
    if (reduceMotionRef.current) return
    hoverRef.current = true
    ensureRunning()
  }, [ensureRunning])

  const onPointerLeave = useCallback(() => {
    hoverRef.current = false // breeze stops
    ensureRunning() // keep the loop alive so it swings back to centre and settles
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
      className="pointer-events-none fixed top-0 right-3 z-40 overflow-visible sm:right-5"
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
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        aria-label={label}
        aria-pressed={isDark}
        title={label}
        className="group pointer-events-auto absolute left-0 top-0 block h-11 w-11 cursor-grab touch-none select-none outline-none active:cursor-grabbing focus-visible:rounded-2xl focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      >
        {/* glow layers 2 (halo) + 3 (bloom) — children of the moving button, so
            they ride the cord's swing for free; pure CSS, gated by the theme. */}
        <span className="bulb-halo" aria-hidden="true" />
        <span className="bulb-bloom" aria-hidden="true" />

        {/* the bulb (wrapper carries the mechanical "clunk" seat on toggle). The
            36×44 art is centred in the 44×44 hit target via margin — NOT transform,
            so the clunk's scaleY never fights the centring. */}
        <span ref={wrapRef} className="bulb-wrap absolute left-1/2 top-0 -ml-[18px] block h-full w-9">
          <svg
            className="bulb-svg h-full w-full overflow-visible"
            viewBox="0 0 36 44"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="bulbGlassOn" cx="50%" cy="40%" r="64%">
                <stop offset="0%" stopColor="#FFEDB8" />
                <stop offset="40%" stopColor="#FFD56A" />
                <stop offset="74%" stopColor="#FFC857" />
                <stop offset="100%" stopColor="#EFA338" />
              </radialGradient>
              <linearGradient id="bulbGlassOff" x1="0.42" y1="0.06" x2="0.58" y2="1">
                <stop offset="0%" stopColor="#44464C" />
                <stop offset="55%" stopColor="#303137" />
                <stop offset="100%" stopColor="#1e1e22" />
              </linearGradient>
              <radialGradient id="bulbGlassDepth" cx="50%" cy="40%" r="68%">
                <stop offset="52%" stopColor="#000000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.38" />
              </radialGradient>
              <linearGradient id="bulbCapOn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#CDAC6E" />
                <stop offset="50%" stopColor="#9C7E48" />
                <stop offset="100%" stopColor="#765C35" />
              </linearGradient>
              <linearGradient id="bulbCapOff" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5C5549" />
                <stop offset="52%" stopColor="#403A31" />
                <stop offset="100%" stopColor="#302B22" />
              </linearGradient>
              <linearGradient id="bulbSheen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* ── OFF / dark: matte pewter bulb, crescent moon, zero emission ── */}
            <g className="bulb-off-layer">
              <rect x="15" y="2" width="6" height="3" rx="1.2" fill="url(#bulbCapOff)" />
              <rect x="11.5" y="4.5" width="13" height="9" rx="2.4" fill="url(#bulbCapOff)" />
              <g stroke="#000" strokeWidth="0.8" strokeOpacity="0.3">
                <line x1="12.4" y1="7" x2="23.6" y2="7" />
                <line x1="12.4" y1="9.4" x2="23.6" y2="9.4" />
                <line x1="12.4" y1="11.8" x2="23.6" y2="11.8" />
              </g>
              <rect x="11.5" y="4.5" width="13" height="2" rx="1.5" fill="#fff" fillOpacity="0.1" />
              <path
                d="M13.2 12.5 C13 16, 6.5 18, 6.5 27 C6.5 36.5, 12 41.5, 18 41.5 C24 41.5, 29.5 36.5, 29.5 27 C29.5 18, 23 16, 22.8 12.5 Z"
                fill="url(#bulbGlassOff)"
                stroke="rgba(150,158,170,0.4)"
                strokeWidth="0.8"
              />
              <path
                d="M13.2 12.5 C13 16, 6.5 18, 6.5 27 C6.5 36.5, 12 41.5, 18 41.5 C24 41.5, 29.5 36.5, 29.5 27 C29.5 18, 23 16, 22.8 12.5 Z"
                fill="url(#bulbGlassDepth)"
              />
              <path
                className="bulb-moon"
                d="M21.8 22.6 a6.4 6.4 0 1 0 0 9.8 a5 5 0 1 1 0 -9.8 Z"
                fill="#a6abb3"
                fillOpacity="0.95"
              />
              <ellipse
                cx="13.4"
                cy="22"
                rx="2.3"
                ry="5"
                fill="url(#bulbSheen)"
                opacity="0.3"
                transform="rotate(-14 13.4 22)"
              />
              <circle cx="23" cy="20.5" r="0.9" fill="#b9bcc0" opacity="0.32" />
              <path
                d="M28.6 31 C28.6 36.5, 24.5 40.6, 19.5 41.2"
                stroke="#6E7A86"
                strokeWidth="1.1"
                strokeLinecap="round"
                fill="none"
                opacity="0.5"
              />
            </g>

            {/* ── ON / light: warm incandescent glass, filament, sun, ember kiss ── */}
            <g className="bulb-on-layer">
              <rect x="15" y="2" width="6" height="3" rx="1.2" fill="url(#bulbCapOn)" />
              <rect x="11.5" y="4.5" width="13" height="9" rx="2.4" fill="url(#bulbCapOn)" />
              <g stroke="#000" strokeWidth="0.8" strokeOpacity="0.18">
                <line x1="12.4" y1="7" x2="23.6" y2="7" />
                <line x1="12.4" y1="9.4" x2="23.6" y2="9.4" />
                <line x1="12.4" y1="11.8" x2="23.6" y2="11.8" />
              </g>
              <rect x="11.5" y="4.5" width="13" height="2" rx="1.5" fill="#fff" fillOpacity="0.3" />
              <path
                d="M13.2 12.5 C13 16, 6.5 18, 6.5 27 C6.5 36.5, 12 41.5, 18 41.5 C24 41.5, 29.5 36.5, 29.5 27 C29.5 18, 23 16, 22.8 12.5 Z"
                fill="url(#bulbGlassOn)"
                stroke="rgba(255,150,40,0.5)"
                strokeWidth="0.8"
              />
              <circle cx="18" cy="27.5" r="6" fill="#FFE69A" fillOpacity="0.5" />
              {/* coiled filament — a faint warm hint behind the sun, not competing with it */}
              <g opacity="0.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13.8 23.5 L15.6 30" stroke="#C8721E" strokeWidth="0.9" />
                <path d="M22.2 23.5 L20.4 30" stroke="#C8721E" strokeWidth="0.9" />
                <path d="M15.6 30 q1.2 -1.6 2.4 0 q1.2 1.6 2.4 0" stroke="#FFE3A3" strokeWidth="1.4" />
                <path d="M15.6 30 q1.2 -1.6 2.4 0 q1.2 1.6 2.4 0" stroke="#FFF6DC" strokeWidth="0.7" />
              </g>
              <g className="bulb-sun" stroke="#A85E1C" strokeWidth="1.4" strokeLinecap="round">
                <circle cx="18" cy="27.5" r="3" fill="#FFF1C8" fillOpacity="0.9" stroke="none" />
                <line x1="18" y1="20.8" x2="18" y2="22.4" />
                <line x1="18" y1="32.6" x2="18" y2="34.2" />
                <line x1="11.3" y1="27.5" x2="12.9" y2="27.5" />
                <line x1="23.1" y1="27.5" x2="24.7" y2="27.5" />
                <line x1="13.3" y1="22.8" x2="14.4" y2="23.9" />
                <line x1="22.7" y1="22.8" x2="21.6" y2="23.9" />
                <line x1="13.3" y1="32.2" x2="14.4" y2="31.1" />
                <line x1="22.7" y1="32.2" x2="21.6" y2="31.1" />
              </g>
              {/* warmth pooling at the base of the glass (kept in the amber family) */}
              <ellipse cx="16" cy="35" rx="4" ry="2.2" fill="rgba(255,184,92,0.38)" />
              <ellipse
                cx="13.4"
                cy="22"
                rx="2.3"
                ry="5"
                fill="url(#bulbSheen)"
                transform="rotate(-14 13.4 22)"
              />
              <circle cx="22.6" cy="34" r="1.3" fill="#fff" />
            </g>
          </svg>
        </span>
      </button>

      {/* glow layer 4 — environmental floor wash. Lives on the static container
          so the pooled light stays put while the bulb swings above it. */}
      <span className="bulb-floor" aria-hidden="true" />
    </div>
  )
}
