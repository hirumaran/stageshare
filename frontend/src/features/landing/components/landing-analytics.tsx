import { motion } from "framer-motion"
import { TrendingUp, Repeat2, Clock } from "lucide-react"
import { Container, Section, Eyebrow } from "./landing-primitives"
import { Reveal, CountUp } from "./landing-motion"

const EASE = [0.22, 1, 0.36, 1] as const

/* Peak-season bars — fall play + spring musical spikes. */
const MONTHS = [
  { m: "S", v: 0.42 },
  { m: "O", v: 0.78 },
  { m: "N", v: 0.95 },
  { m: "D", v: 0.5 },
  { m: "J", v: 0.34 },
  { m: "F", v: 0.6 },
  { m: "M", v: 0.88 },
  { m: "A", v: 0.82 },
  { m: "M", v: 0.46 },
  { m: "J", v: 0.22 },
]

function PeakChart() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <div>
          <span className="lp-eyebrow">Peak production seasons</span>
          <p className="mt-2 text-[15px] font-medium tracking-[-0.01em] text-[var(--text-primary)]">
            When demand spikes — and where to plan ahead
          </p>
        </div>
      </div>
      <div className="mt-7 flex flex-1 items-end gap-2 sm:gap-3">
        {MONTHS.map((d, i) => {
          const peak = d.v > 0.85
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-[140px] w-full items-end">
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: `${d.v * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.05, ease: EASE }}
                  className="w-full rounded-md"
                  style={{ background: peak ? "var(--ember)" : "var(--foreground)", opacity: peak ? 1 : 0.82 }}
                />
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">{d.m}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* Utilization area chart trending up. */
function UtilizationChart() {
  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <span className="lp-eyebrow">Resource utilization</span>
        <div className="mt-3 flex items-end gap-2">
          <span className="lp-tnum text-[40px] font-semibold leading-none tracking-[-0.03em] text-[var(--text-primary)]">
            <CountUp value="43" />%
          </span>
          <span className="mb-1 inline-flex items-center gap-1 text-[13px] font-medium text-[#2f7d4f]">
            <TrendingUp size={14} strokeWidth={2} /> this year
          </span>
        </div>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">More of what you own, actually in use.</p>
      </div>
      <svg viewBox="0 0 280 90" className="mt-5 w-full" fill="none" preserveAspectRatio="none">
        <motion.path
          d="M0 78 C 40 72, 60 64, 90 60 C 130 54, 150 40, 190 30 C 220 22, 250 14, 280 8"
          stroke="var(--ember)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.3, ease: EASE }}
        />
        <motion.path
          d="M0 78 C 40 72, 60 64, 90 60 C 130 54, 150 40, 190 30 C 220 22, 250 14, 280 8 L280 90 L0 90 Z"
          fill="var(--ember)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </svg>
    </div>
  )
}

const STATS = [
  { icon: Repeat2, value: "2,140", label: "Borrows fulfilled district-wide" },
  { icon: TrendingUp, value: "$1.2M", label: "Re-use value unlocked from existing stock" },
  { icon: Clock, value: "1.8", suffix: " days", label: "Average time to hand off a request" },
]

export function LandingAnalytics() {
  return (
    <Section id="insights" className="scroll-mt-24">
      <Container>
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow>Insights &amp; analytics</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-[var(--text-primary)]">
              Know exactly what your stage is worth.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-[17px] leading-[1.65] text-[var(--text-secondary)]">
              Clio turns thousands of loans into a clear picture — utilization, peak
              seasons, and fulfillment trends that help teachers plan and help districts
              prove the program pays for itself.
            </p>
          </Reveal>
        </div>

        {/* bento */}
        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <Reveal delay={0.05} className="lg:col-span-5">
            <div className="landing-float-card landing-lift h-full p-6">
              <UtilizationChart />
            </div>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="landing-float-card landing-lift h-full p-6">
              <PeakChart />
            </div>
          </Reveal>

          {STATS.map((s, i) => {
            const Icon = s.icon
            return (
              <Reveal key={s.label} delay={0.1 + i * 0.06} className="lg:col-span-4">
                <div className="landing-float-card landing-lift flex h-full items-start gap-4 p-6">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "var(--bg-subtle)" }}
                  >
                    <Icon size={20} strokeWidth={1.6} style={{ color: "var(--text-primary)" }} />
                  </div>
                  <div>
                    <div className="lp-tnum text-[30px] font-semibold leading-none tracking-[-0.03em] text-[var(--text-primary)]">
                      <CountUp value={s.value} />
                      {s.suffix && <span className="text-[18px] font-medium">{s.suffix}</span>}
                    </div>
                    <p className="mt-2 text-[13.5px] leading-snug text-[var(--text-muted)]">{s.label}</p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
