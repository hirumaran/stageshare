import { useRef } from "react"
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion"
import { ArrowDown, ArrowRight, Check } from "lucide-react"
import { Link } from "react-router-dom"
import { SectionWrapper, LandingLinkButton } from "./landing-primitives"
import { CountUp } from "./landing-motion"

const EASE = [0.22, 1, 0.36, 1] as const

const METRICS = [
  { value: "2,200+", label: "Shared resources" },
  { value: "3", label: "District schools" },
  { value: "95%", label: "Fulfillment rate" },
]

/* ─── Floating catalogue card cluster — the hero's focal eye-candy ─── */
function CardCluster({ mx, my }: { mx: MotionValue<number>; my: MotionValue<number> }) {
  // Each card drifts at a different depth for parallax.
  const useDrift = (range: number) => ({
    x: useSpring(useTransform(mx, [-0.5, 0.5], [-range, range]), { stiffness: 120, damping: 18 }),
    y: useSpring(useTransform(my, [-0.5, 0.5], [-range * 0.6, range * 0.6]), { stiffness: 120, damping: 18 }),
  })
  const back = useDrift(14)
  const mid = useDrift(26)
  const front = useDrift(40)
  const chip = useDrift(54)

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]" style={{ perspective: 1000 }}>
      {/* Back card — quiet listing */}
      <motion.div
        style={{ x: back.x, y: back.y }}
        initial={{ opacity: 0, y: 40, rotate: -10 }}
        animate={{ opacity: 1, y: 0, rotate: -7 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.35 }}
        className="landing-float-card absolute left-[2%] top-[12%] w-[52%] p-5"
      >
        <p className="text-[11px] tracking-[-0.01em] text-[var(--primary)]">Set pieces</p>
        <p className="mt-2 text-[15px] font-medium tracking-[-0.02em] text-[var(--text-primary)]">Forest backdrop</p>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
          <span className="text-[11px] text-[var(--text-muted)]">Available · Big Picture</span>
        </div>
      </motion.div>

      {/* Mid card — gold-accented listing */}
      <motion.div
        style={{ x: mid.x, y: mid.y }}
        initial={{ opacity: 0, y: 48, rotate: 8 }}
        animate={{ opacity: 1, y: 0, rotate: 5 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.45 }}
        className="landing-float-card absolute right-[3%] top-[4%] w-[50%] overflow-hidden p-0"
      >
        <div className="landing-swatch h-20 w-full" />
        <div className="p-5">
          <p className="text-[11px] tracking-[-0.01em] text-[var(--primary)]">Costumes</p>
          <p className="mt-2 text-[15px] font-medium tracking-[-0.02em] text-[var(--text-primary)]">Victorian gown</p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
            <span className="text-[11px] text-[var(--text-muted)]">Newport HS</span>
          </div>
        </div>
      </motion.div>

      {/* Front card — featured, with request action */}
      <motion.div
        style={{ x: front.x, y: front.y }}
        initial={{ opacity: 0, y: 56, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.55 }}
        className="landing-float-card absolute bottom-[6%] left-[14%] w-[62%] p-5"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] tracking-[-0.01em] text-[var(--primary)]">Props</p>
          <span className="text-[10px] text-[var(--text-muted)]">3 mi away</span>
        </div>
        <p className="mt-2 text-[17px] font-medium tracking-[-0.02em] text-[var(--text-primary)]">Edwardian tea set</p>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">12 pieces · porcelain</p>
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-[6px] bg-[var(--foreground)] px-3 py-1.5 text-[12px] font-medium text-[var(--background)]">
            Request
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" /> Available
          </span>
        </div>
      </motion.div>

      {/* Floating confirmation chip */}
      <motion.div
        style={{ x: chip.x, y: chip.y }}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.8 }}
        className="landing-float-card absolute right-[0%] bottom-[24%] flex items-center gap-2 !rounded-full px-3.5 py-2"
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--gold)]">
          <Check className="h-2.5 w-2.5 text-[var(--wine)]" strokeWidth={3} />
        </span>
        <span className="text-[12px] font-medium tracking-[-0.01em] text-[var(--text-primary)]">Loan approved</span>
      </motion.div>
    </div>
  )
}

export function LandingHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduce) return
    const el = sectionRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <SectionWrapper
      ref={sectionRef}
      onMouseMove={handleMove}
      className="relative flex min-h-screen items-center overflow-hidden pt-28 pb-16"
    >
      <div className="landing-hero-glow" aria-hidden="true" />
      <div className="landing-grain" aria-hidden="true" />

      <div className="container relative z-10">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-10">
          {/* Left — copy */}
          <div className="order-2 lg:order-1">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] py-1.5 pl-2.5 pr-3.5 text-[12px] font-medium tracking-[-0.01em] text-[var(--text-secondary)]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
              Drama Teacher Resource Library
            </motion.span>

            <h1 className="mt-7 text-[clamp(2.75rem,7vw,5rem)] leading-[0.98] tracking-[-0.04em] font-medium text-[var(--text-primary)]">
              {["Built for", "the "].map((line, i) => (
                <span key={line} className="block overflow-hidden">
                  <motion.span
                    className="block"
                    initial={{ y: "115%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.2 + i * 0.1 }}
                  >
                    {line === "the " ? (
                      <>
                        the <span className="landing-accent-text">stage.</span>
                      </>
                    ) : (
                      line
                    )}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
              className="mt-7 max-w-md text-[18px] leading-[1.6] tracking-[-0.01em] text-[var(--text-secondary)]"
            >
              Borrow, lend, and track props, costumes, and set pieces across your district.
              One shared catalogue for every production.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.62 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <LandingLinkButton to="/signup" variant="primary" className="group">
                Create a free account
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
              </LandingLinkButton>
              <LandingLinkButton to="/catalogue" variant="outline">
                Browse catalogue
              </LandingLinkButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.74 }}
              className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-[var(--border-default)] pt-8"
            >
              {METRICS.map((m) => (
                <div key={m.label}>
                  <CountUp
                    value={m.value}
                    className="block text-2xl font-medium tracking-[-0.03em] text-[var(--text-primary)] md:text-3xl"
                  />
                  <span className="mt-2 block text-[12px] tracking-[-0.01em] text-[var(--text-muted)]">
                    {m.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — focal visual */}
          <div className="order-1 lg:order-2">
            <CardCluster mx={mx} my={my} />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.1 }}
        className="container absolute bottom-8 left-0 right-0 z-10 hidden lg:flex"
      >
        <Link
          to="#platform"
          className="group inline-flex items-center gap-2 text-[12px] tracking-[-0.01em] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          Scroll
          <motion.span animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
            <ArrowDown className="h-3.5 w-3.5" strokeWidth={1.5} />
          </motion.span>
        </Link>
      </motion.div>
    </SectionWrapper>
  )
}
