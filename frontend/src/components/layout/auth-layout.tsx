import { Suspense, useEffect } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import {
  MotionConfig,
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion"
import { DotPattern } from "@/registry/aliimam/components/dot-pattern"

const EASE = [0.22, 1, 0.36, 1] as const

/* Clio brand mark — proscenium arch with a single ember spotlight.
   Mirrors the landing brand mark so the auth screens read as the same product;
   inlined here (rather than imported from the landing feature) to keep the
   auth flow self-contained. */
function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M5 28V14a11 11 0 0 1 22 0v14"
        stroke="var(--av-text)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M3.5 28h25" stroke="var(--av-text)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="16" cy="9.5" r="3" fill="var(--av-ember)" />
    </svg>
  )
}

function Wordmark() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--av-ember)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--av-stage)]"
      aria-label="Clio home"
    >
      <Mark />
      <span className="text-[19px] font-semibold tracking-[-0.04em] text-[var(--av-text)]">
        Clio
      </span>
    </Link>
  )
}

/* The single ornament — an obsidian glass orb with an iridescent signal-red
   rim, the one dimensional object on an otherwise weightless dark stage. It
   drifts, breathes, and the refracted rim slowly rotates. Every loop collapses
   under reduced motion (the bloom holds, the rim rests). */
function StageOrb() {
  const reduce = useReducedMotion()
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-24 top-1/2 h-[clamp(360px,40vw,560px)] w-[clamp(360px,40vw,560px)] -translate-y-1/2"
    >
      {/* red bloom behind the orb */}
      <motion.div
        className="absolute inset-[-18%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,106,77,0.22) 0%, rgba(255,106,77,0.05) 42%, transparent 66%)",
          filter: "blur(28px)",
        }}
        animate={reduce ? undefined : { scale: [1, 1.07, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute inset-0"
        animate={reduce ? undefined : { y: [0, -16, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* iridescent refraction rim — a soft chromatic ring that rotates */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 210deg, #ff6a4d, #ff8a6d, #b14bff, #4b7bff, #2bd4ff, #ff6a4d)",
            WebkitMaskImage:
              "radial-gradient(closest-side, transparent 68%, #000 77%, #000 93%, transparent 100%)",
            maskImage:
              "radial-gradient(closest-side, transparent 68%, #000 77%, #000 93%, transparent 100%)",
            filter: "blur(7px)",
            opacity: 0.72,
          }}
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
        />

        {/* glass body — dark sphere with a top-left sheen and a warm red belly */}
        <div
          className="absolute inset-[6%] rounded-full"
          style={{
            background:
              "radial-gradient(120% 120% at 32% 26%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 36%)," +
              "radial-gradient(110% 110% at 72% 78%, rgba(255,106,77,0.16) 0%, rgba(255,106,77,0) 52%)," +
              "radial-gradient(120% 120% at 50% 50%, #1b1b1f 0%, #0c0c0e 56%, #050506 100%)",
            boxShadow:
              "inset 0 0 70px rgba(0,0,0,0.85), inset -14px -18px 60px rgba(255,106,77,0.16)",
          }}
        />

        {/* specular highlight */}
        <div
          className="absolute left-[26%] top-[20%] h-[20%] w-[20%] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.55) 0%, transparent 62%)",
            filter: "blur(5px)",
          }}
        />
      </motion.div>
    </div>
  )
}

/* Headline lines rise + fade in sequence (reduced motion keeps the fade,
   drops the y-shift). Weight 300 at scale is the editorial signature. */
const HEADLINE_LINES = ["Share the", "spotlight."]
const headlineContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
const headlineLine = {
  hidden: { opacity: 0, y: "0.55em" },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
}

export default function AuthLayout() {
  const location = useLocation()
  const reduce = useReducedMotion()

  // Paint the document warm-dark for the lifetime of the auth flow so the area
  // exposed by overscroll (and the brief route-chunk fallback) reads as the
  // stage rather than flashing the app's light/dark base background. --av-canvas
  // is scoped to .auth-root, so the literal is used here on <body>/<html>.
  useEffect(() => {
    const root = document.documentElement
    const prevBg = document.body.style.background
    const prevScheme = root.style.colorScheme
    document.body.style.background = "#161310"
    root.style.colorScheme = "dark"
    return () => {
      document.body.style.background = prevBg
      root.style.colorScheme = prevScheme
    }
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <div className="auth-root flex min-h-screen">
        {/* ── Brand stage (left) ── */}
        <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-[var(--av-border)] bg-[var(--av-stage)] p-12 lg:flex xl:p-16">
          <DotPattern
            width={24}
            height={24}
            cx={1}
            cy={1}
            cr={1}
            className="z-0 fill-[rgba(255,255,255,0.05)] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_0%,transparent_75%)]"
          />
          {/* follow-spot from above */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(70% 50% at 50% -10%, rgba(255,106,77,0.10), transparent 60%)",
            }}
          />
          <StageOrb />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative z-10"
          >
            <Wordmark />
          </motion.div>

          <div className="relative z-10 max-w-lg">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
              className="av-eyebrow inline-flex items-center gap-2.5"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--av-ember)" }}
                aria-hidden
              />
              Clio for educators
            </motion.span>

            {/* Decorative brand-stage display copy — deliberately NOT a heading
                so the form panel's <h1> ("Welcome back" / "Create an account")
                is the page's single primary heading. */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={headlineContainer}
              className="mt-6 text-[clamp(2.6rem,5vw,4rem)] font-light leading-[1.0] tracking-[-0.045em] text-[var(--av-text)]"
            >
              {HEADLINE_LINES.map((line, i) => (
                <motion.span key={line} variants={headlineLine} className="block">
                  {i === HEADLINE_LINES.length - 1 ? (
                    <span className="relative inline-block w-fit">
                      {line}
                      <svg
                        className="absolute -bottom-1.5 left-0 w-full"
                        viewBox="0 0 200 12"
                        fill="none"
                        preserveAspectRatio="none"
                        aria-hidden
                      >
                        <motion.path
                          d="M2 8C46 3 154 3 198 7"
                          stroke="var(--av-ember)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          initial={{ pathLength: reduce ? 1 : 0 }}
                          animate={{ pathLength: 1 }}
                          transition={reduce ? { duration: 0 } : { duration: 0.9, ease: EASE, delay: 0.8 }}
                        />
                      </svg>
                    </span>
                  ) : (
                    line
                  )}
                </motion.span>
              ))}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
              className="mt-7 max-w-md text-[17px] leading-[1.6] text-[var(--av-text-secondary)]"
            >
              Scripts, costumes, props, and teaching resources — shared across
              every drama department in your district.
            </motion.p>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative z-10 text-[13px] text-[var(--av-muted)]"
          >
            Built for drama departments in Bellevue School District
          </motion.p>
        </div>

        {/* ── Form panel (right) ── */}
        <div className="relative flex flex-1 items-center justify-center bg-[var(--av-canvas)] px-6 py-16 sm:px-10">
          {/* faint follow-spot anchoring the form on the obsidian void */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 45% at 50% 0%, rgba(255,106,77,0.06), transparent 60%)",
            }}
          />

          <Link
            to="/"
            className="absolute left-6 top-6 inline-flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--av-ember)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--av-canvas)] lg:hidden"
            aria-label="Clio home"
          >
            <Mark size={22} />
            <span className="text-[17px] font-semibold tracking-[-0.04em] text-[var(--av-text)]">
              Clio
            </span>
          </Link>

          <div className="relative z-10 w-full max-w-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                {/* Boundary scoped to the form column: when a lazy auth-page
                    chunk loads, only this panel waits — the brand stage stays
                    mounted instead of being torn down by the App-root Suspense
                    and replaying its whole intro. */}
                <Suspense fallback={<div className="h-[420px] w-full" aria-hidden />}>
                  <Outlet />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </MotionConfig>
  )
}
