import { motion } from "framer-motion"
import { ArrowRight, ArrowDown } from "lucide-react"
import { DotPattern } from "@/registry/aliimam/components/dot-pattern"
import { Container, Button } from "./landing-primitives"
import { ResourceCard, Float, SchoolDot, type Resource } from "./landing-ui"

const EASE = [0.22, 1, 0.36, 1] as const

const HERO_CARDS: { resource: Resource; style: string; float: number; delay: number }[] = [
  {
    resource: {
      title: "Victorian Frock Coat",
      category: "costumes",
      school: "Lincoln High",
      condition: "Excellent",
      status: "Available",
    },
    style: "left-0 top-6 w-[210px]",
    float: 10,
    delay: 0,
  },
  {
    resource: {
      title: "LED PAR Wash Kit ×6",
      category: "lighting",
      school: "Roosevelt Middle",
      condition: "Good",
      status: "Reserved",
    },
    style: "right-2 top-0 w-[212px]",
    float: 13,
    delay: 0.6,
  },
  {
    resource: {
      title: "Hamlet — 24 scripts",
      category: "scripts",
      school: "Jefferson High",
      condition: "Good",
      status: "Available",
    },
    style: "right-10 bottom-2 w-[204px]",
    float: 9,
    delay: 1.1,
  },
]

export function LandingHero() {
  return (
    <header className="relative overflow-hidden pt-32 sm:pt-40 lg:pt-44">
      {/* Warm, radially-faded dot texture behind the hero */}
      <DotPattern
        width={22}
        height={22}
        cx={1}
        cy={1}
        cr={1.2}
        className="z-0 fill-[var(--foreground)]/[0.08] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_30%,#000_0%,transparent_72%)]"
      />
      <Container className="relative z-10">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* ── Copy ── */}
          <div className="max-w-xl">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-raised)] px-3 py-1.5 text-[12.5px] font-medium tracking-[-0.01em] text-[var(--text-secondary)]"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ember)" }} />
              The resource network for K-12 theatre
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.06 }}
              className="mt-6 text-[clamp(2.6rem,6.4vw,4.6rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-[var(--text-primary)]"
            >
              The theatre your
              <br />
              district already
              <br />
              <span className="relative whitespace-nowrap">
                owns.
                <svg
                  className="absolute -bottom-2 left-0 w-[2.6em]"
                  viewBox="0 0 120 12"
                  fill="none"
                  aria-hidden
                >
                  <motion.path
                    d="M2 8C28 3 92 3 118 7"
                    stroke="var(--ember)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.7 }}
                  />
                </svg>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.16 }}
              className="mt-7 max-w-md text-[17px] leading-[1.6] tracking-[-0.01em] text-[var(--text-secondary)]"
            >
              Clio connects every drama department in your district into one shared
              inventory — so the costume one school is storing is the prop another
              school needs opening night. Borrow, lend, and track it all.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.24 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Button to="/signup" className="px-7 py-3.5 text-[15px]">
                Get started free
                <ArrowRight size={17} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button variant="secondary" to="#how" className="px-6 py-3.5 text-[15px]">
                See how it works
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-6 text-[13px] tracking-[-0.01em] text-[var(--text-muted)]"
            >
              Built for drama teachers · No setup fees · District-ready in a day
            </motion.p>
          </div>

          {/* ── Crafted floating catalogue cluster ── */}
          <div className="relative hidden h-[440px] lg:block" aria-hidden>
            {/* connector lines — emanate from the district node (lower-left) */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 480 440" fill="none">
              {[
                "M120 360 C 118 300, 118 230, 118 185",
                "M150 360 C 240 320, 300 180, 360 110",
                "M155 365 C 250 360, 310 345, 360 330",
              ].map((d, i) => (
                <motion.path
                  key={d}
                  d={d}
                  stroke="var(--border-strong)"
                  strokeWidth="1.5"
                  strokeDasharray="4 5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.9 + i * 0.15 }}
                />
              ))}
            </svg>

            {/* district network node — anchored lower-left, clear of cards */}
            <Float amplitude={6} duration={7} className="absolute bottom-4 left-0 z-10">
              <div className="landing-float-card flex items-center gap-3 px-4 py-3">
                <div className="flex -space-x-2">
                  {["Lincoln High", "Roosevelt Middle", "Jefferson High", "Edison Arts"].map(
                    (s) => (
                      <div key={s} className="rounded-full ring-2 ring-[var(--bg-raised)]">
                        <SchoolDot name={s} size={26} />
                      </div>
                    )
                  )}
                </div>
                <div className="leading-tight">
                  <div className="text-[13px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                    Mapleton District
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">12 schools connected</div>
                </div>
              </div>
            </Float>

            {HERO_CARDS.map((c, i) => (
              <motion.div
                key={c.resource.title}
                initial={{ opacity: 0, y: 28, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.35 + i * 0.12 }}
                className={`absolute ${c.style}`}
              >
                <Float amplitude={c.float} delay={c.delay} duration={6 + i}>
                  <ResourceCard resource={c.resource} compact />
                </Float>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>

      {/* scroll cue */}
      <motion.a
        href="#proof"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="relative z-10 mx-auto mt-16 flex w-fit flex-col items-center gap-2 text-[var(--text-muted)] sm:mt-20"
        aria-label="Scroll down"
      >
        <span className="lp-eyebrow">Scroll</span>
        <motion.span
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown size={16} strokeWidth={1.5} />
        </motion.span>
      </motion.a>
    </header>
  )
}
