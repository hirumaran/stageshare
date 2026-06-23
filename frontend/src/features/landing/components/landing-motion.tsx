import {
  useRef,
  useState,
  useEffect,
  type ReactNode,
  type ElementType,
  type RefObject,
} from "react"
import {
  motion,
  animate,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useReducedMotion,
} from "framer-motion"

const EASE = [0.22, 1, 0.36, 1] as const

/* ──────────────────────────────────────────────────────────────
   ScrollProgress — thin accent bar pinned to the top of the page,
   width driven by overall scroll position.
   ────────────────────────────────────────────────────────────── */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })
  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[60] h-px origin-left"
      style={{ scaleX, background: "var(--primary)" }}
    />
  )
}

/* ──────────────────────────────────────────────────────────────
   HeroScrollStroke — the page's main scroll affordance, drawn as a
   needle-and-thread that sews itself across the full width of the page.
   A spool of ember thread (left) feeds a hand-drawn stitch toward a
   sewing needle (right); the stitch — the functional part — reveals
   along its route as the hero scrolls past (pathLength driven by the
   hero's scroll progress and springed for momentum), so it literally
   follows the reader down the page. A faint ghost track shows where it's
   headed; a small "Scroll" eyebrow fades once they engage. The spool and
   needle are pure eye candy — wardrobe depictions that idle with a gentle
   bob. The whole band stays an anchor to the first section, keeping its
   tap-to-scroll job. Under reduced motion the stitch is drawn in full and
   held, and the bob is dropped (MotionConfig reducedMotion="user").
   ────────────────────────────────────────────────────────────── */

// One long, gentle stitch with a single playful loop, authored on a wide,
// short viewBox. Rendered with preserveAspectRatio="none" + non-scaling
// stroke so it fills the page edge-to-edge at a fixed height while the
// stroke weight and round caps stay crisp.
const THREAD_PATH =
  "M30 56 C200 56 300 36 470 40 C620 44 700 72 860 70 C980 68 1010 42 1060 36 C1110 30 1152 38 1144 58 C1138 74 1092 74 1086 56 C1082 42 1140 32 1210 38 C1340 48 1420 60 1500 58 C1545 57 1560 56 1578 56"

const EMBER_GLOW =
  "drop-shadow(0 1px 6px color-mix(in srgb, var(--ember) 45%, transparent))"

/* Gentle perpetual bob for the decorative end-pieces. Idles only while the
   band is on screen so Framer's rAF loop isn't kept alive off-screen; the
   transform drops automatically under reduced motion. */
function Bob({
  children,
  active,
  amplitude = 5,
  duration = 5.5,
  delay = 0,
}: {
  children: ReactNode
  active: boolean
  amplitude?: number
  duration?: number
  delay?: number
}) {
  return (
    <motion.div
      aria-hidden
      className="shrink-0"
      animate={active ? { y: [0, -amplitude, 0] } : { y: 0 }}
      transition={
        active
          ? { duration, delay, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.3 }
      }
    >
      {children}
    </motion.div>
  )
}

/* Eye candy — a side-view spool of ember thread (the stitch's source). */
function ThreadSpool() {
  return (
    <svg viewBox="0 0 60 80" fill="none" aria-hidden className="h-auto w-10 overflow-visible sm:w-12">
      {/* flanges */}
      <rect x="6" y="9" width="48" height="11" rx="4" fill="var(--text-secondary)" />
      <rect x="6" y="60" width="48" height="11" rx="4" fill="var(--text-secondary)" />
      {/* barrel core */}
      <rect x="21" y="18" width="18" height="44" rx="2" fill="var(--text-muted)" />
      {/* wound thread */}
      {[22, 30, 38, 46, 54].map((y) => (
        <rect key={y} x="15" y={y} width="30" height="6" rx="3" fill="var(--ember)" />
      ))}
      {/* loose thread end, curling out toward the stitch */}
      <path
        d="M45 41 C53 41 57 37 60 35"
        stroke="var(--ember)"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ filter: EMBER_GLOW }}
      />
    </svg>
  )
}

/* Eye candy — a threaded sewing needle (the stitch's destination). */
function Needle() {
  return (
    <svg viewBox="0 0 72 80" fill="none" aria-hidden className="h-auto w-11 overflow-visible sm:w-14">
      {/* needle body — blunt eye-end at lower-left, tip at upper-right */}
      <path d="M16 60 L60 14" stroke="var(--text-secondary)" strokeWidth="4.5" strokeLinecap="round" />
      {/* sheen */}
      <path d="M19 58 L57 18" stroke="var(--bg-raised)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      {/* tip */}
      <path d="M59 16 L64 10" stroke="var(--text-secondary)" strokeWidth="2.4" strokeLinecap="round" />
      {/* the eye — a hole near the blunt end */}
      <ellipse
        cx="20"
        cy="54"
        rx="2.6"
        ry="5.4"
        fill="var(--bg-base)"
        stroke="var(--text-secondary)"
        strokeWidth="2"
        transform="rotate(-46 20 54)"
      />
      {/* thread arriving from the stitch, through the eye, with a short tail */}
      <path
        d="M2 66 C9 62 15 58 19 55 M23 51 C28 47 28 44 24 43"
        stroke="var(--ember)"
        strokeWidth="2.6"
        strokeLinecap="round"
        style={{ filter: EMBER_GLOW }}
      />
    </svg>
  )
}

export function HeroScrollStroke({
  targetRef,
  href = "#proof",
  className = "",
}: {
  /** The hero <header>; its scroll-out drives how far the stitch is sewn. */
  targetRef: RefObject<HTMLElement | null>
  href?: string
  className?: string
}) {
  const reduce = useReducedMotion()
  const rootRef = useRef<HTMLAnchorElement>(null)
  const inView = useInView(rootRef, { margin: "120px" })
  // 0 at the top of the page → 1 once the hero has scrolled fully past the top.
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  })
  // Front-load the draw into the first ~65% of that travel so the stitch
  // completes while still on screen; rest stands as an invitation.
  const drawn = useTransform(scrollYProgress, [0, 0.65], [0.16, 1])
  const pathLength = useSpring(drawn, { stiffness: 90, damping: 28, mass: 0.4 })
  const labelOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])
  const bob = !reduce && inView

  return (
    <motion.a
      ref={rootRef}
      href={href}
      aria-label="Scroll to content"
      className={`relative z-10 block w-full ${className}`}
    >
      <motion.span
        className="lp-eyebrow block text-center text-[var(--text-muted)]"
        style={reduce ? undefined : { opacity: labelOpacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        transition={{ delay: 1.1, duration: 0.8 }}
      >
        Scroll
      </motion.span>

      <div className="mt-3 flex w-full items-center gap-2 px-5 sm:gap-4 sm:px-10">
        <Bob active={bob}>
          <ThreadSpool />
        </Bob>

        <svg
          viewBox="0 0 1600 100"
          fill="none"
          aria-hidden="true"
          preserveAspectRatio="none"
          className="h-[clamp(44px,6.5vw,96px)] min-w-0 flex-1 overflow-visible"
        >
          {/* ghost track — the stitch's full route, faint */}
          <path
            d={THREAD_PATH}
            stroke="var(--border-strong)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            opacity={0.5}
          />
          {/* ember stitch — sews itself along the route with scroll */}
          <motion.path
            d={THREAD_PATH}
            stroke="var(--ember)"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{
              pathLength: reduce ? 1 : pathLength,
              filter: EMBER_GLOW,
            }}
          />
        </svg>

        <Bob active={bob} delay={0.4}>
          <Needle />
        </Bob>
      </div>
    </motion.a>
  )
}

/* ──────────────────────────────────────────────────────────────
   Magnetic — pulls its child toward the cursor on hover, springs
   back on leave. Disabled under reduced-motion + on touch.
   ────────────────────────────────────────────────────────────── */
export function Magnetic({
  children,
  strength = 0.35,
  className = "",
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 15, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 200, damping: 15, mass: 0.4 })

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = e.clientX - (rect.left + rect.width / 2)
    const relY = e.clientY - (rect.top + rect.height / 2)
    x.set(relX * strength)
    y.set(relY * strength)
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  )
}

/* ──────────────────────────────────────────────────────────────
   CountUp — counts a numeric value up from zero when scrolled into
   view. Parses a display string like "2,200+", "99.9%", "3x" and
   preserves its prefix/suffix while animating the number.
   ────────────────────────────────────────────────────────────── */
function parseMetric(value: string) {
  const match = value.match(/-?[\d.,]+/)
  if (!match) return { prefix: "", number: 0, suffix: value, decimals: 0, hasComma: false }
  const raw = match[0]
  const prefix = value.slice(0, match.index)
  const suffix = value.slice((match.index ?? 0) + raw.length)
  const hasComma = raw.includes(",")
  const numeric = parseFloat(raw.replace(/,/g, ""))
  const dot = raw.replace(/,/g, "").split(".")[1]
  const decimals = dot ? dot.length : 0
  return { prefix, number: numeric, suffix, decimals, hasComma }
}

export function CountUp({
  value,
  className = "",
  duration = 1.6,
}: {
  value: string
  className?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const reduce = useReducedMotion()
  const { prefix, number, suffix, decimals, hasComma } = parseMetric(value)
  const count = useMotionValue(0)
  // Render the formatted value straight off the motion value — framer keeps
  // the span's text in sync without per-frame React re-renders.
  const text = useTransform(count, (latest) => formatNumber(latest, decimals, hasComma))

  useEffect(() => {
    if (reduce) {
      count.set(number)
      return
    }
    if (!inView) return
    const controls = animate(count, number, { duration, ease: EASE })
    return () => controls.stop()
  }, [inView, reduce, number, duration, count])

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{text}</motion.span>
      {suffix}
    </span>
  )
}

function formatNumber(n: number, decimals: number, hasComma: boolean) {
  const fixed = n.toFixed(decimals)
  if (!hasComma) return fixed
  const [int, dec] = fixed.split(".")
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return dec ? `${withCommas}.${dec}` : withCommas
}

/* ──────────────────────────────────────────────────────────────
   Marquee — seamless infinite horizontal scroll. Pauses on hover.
   ────────────────────────────────────────────────────────────── */
export function Marquee({
  children,
  speed = 40,
  reverse = false,
  className = "",
}: {
  children: ReactNode
  speed?: number
  /** Scroll right-to-left by default; set true to run the track the other way. */
  reverse?: boolean
  className?: string
}) {
  const reduce = useReducedMotion()
  if (reduce) {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-x-16 gap-y-8 ${className}`}>
        {children}
      </div>
    )
  }
  return (
    <div className={`marquee group relative overflow-hidden ${className}`}>
      {/* Two identical copies, each carrying its own trailing gap (pr-*), so the
          -50% scroll lands copy two exactly where copy one began — seamless, with
          no half-gap jump at the seam. The duplicate is aria-hidden to stay out of
          the reading order and to avoid colliding keys with the first copy. */}
      <div
        className="marquee__track flex w-max"
        style={{ animationDuration: `${speed}s`, animationDirection: reverse ? "reverse" : undefined }}
      >
        <div className="flex shrink-0 items-center gap-x-16 pr-16 md:gap-x-24 md:pr-24">
          {children}
        </div>
        <div aria-hidden className="flex shrink-0 items-center gap-x-16 pr-16 md:gap-x-24 md:pr-24">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Reveal — drop-in scroll reveal with a small upward drift.
   ────────────────────────────────────────────────────────────── */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  as = "div",
  className = "",
}: {
  children: ReactNode
  delay?: number
  y?: number
  as?: ElementType
  className?: string
}) {
  const MotionTag = motion[as as keyof typeof motion] as ElementType
  return (
    <MotionTag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      className={className}
    >
      {children}
    </MotionTag>
  )
}

/* ──────────────────────────────────────────────────────────────
   Stagger / StaggerItem — orchestrated scroll reveal. The parent
   cascades its children in sequence instead of a single block fade.
   Pair them: <Stagger><StaggerItem/>…</Stagger>. Under reduced motion
   Framer keeps the fade and drops the y-transform.
   ────────────────────────────────────────────────────────────── */
export function Stagger({
  children,
  delay = 0,
  stagger = 0.08,
  as = "div",
  className = "",
}: {
  children: ReactNode
  delay?: number
  stagger?: number
  as?: ElementType
  className?: string
}) {
  const MotionTag = motion[as as keyof typeof motion] as ElementType
  return (
    <MotionTag
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      className={className}
    >
      {children}
    </MotionTag>
  )
}

export function StaggerItem({
  children,
  y = 16,
  as = "div",
  className = "",
}: {
  children: ReactNode
  y?: number
  as?: ElementType
  className?: string
}) {
  const MotionTag = motion[as as keyof typeof motion] as ElementType
  return (
    <MotionTag
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
      className={className}
    >
      {children}
    </MotionTag>
  )
}

/* ──────────────────────────────────────────────────────────────
   useScrollSpy — returns the id of the section currently in view.
   ────────────────────────────────────────────────────────────── */
export function useScrollSpy(ids: string[], offset = 120) {
  const [active, setActive] = useState<string | null>(null)
  // Callers pass a fresh array each render (ids.map(...)); a joined string keeps
  // the effect from re-subscribing the scroll listener on every render.
  const key = ids.join("|")
  useEffect(() => {
    const list = key ? key.split("|") : []
    let raf = 0
    const compute = () => {
      raf = 0
      let current: string | null = null
      for (const id of list) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top - offset <= 0) current = id
      }
      setActive(current)
    }
    // rAF-throttle so layout is read at most once per frame instead of on every
    // (potentially sub-frame) passive scroll event.
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute)
    }
    compute()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [key, offset])
  return active
}
