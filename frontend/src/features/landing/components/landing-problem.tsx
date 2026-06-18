import { motion } from "framer-motion"
import { Shirt, Wand2, Lightbulb, Lock } from "lucide-react"
import { Container, Section, Eyebrow } from "./landing-primitives"
import { Reveal } from "./landing-motion"

const IDLE = [
  { icon: Shirt, label: "32 costumes", note: "last used · 2019" },
  { icon: Wand2, label: "Prop store", note: "uncatalogued" },
  { icon: Lightbulb, label: "Lighting rig", note: "in a closet" },
]

export function LandingProblem() {
  return (
    <Section className="overflow-hidden">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Copy */}
          <div className="max-w-xl">
            <Reveal>
              <Eyebrow>The problem</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-5 text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-[var(--text-primary)]">
                Right now, the magic is
                <br className="hidden sm:block" /> sitting in the dark.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 text-[17px] leading-[1.65] text-[var(--text-secondary)]">
                Every theatre department is quietly sitting on thousands of dollars of
                costumes, props, scripts, and gear — boxed up in closets, basements, and
                back-of-stage. Nobody outside the building knows it exists.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-4 text-[17px] leading-[1.65] text-[var(--text-secondary)]">
                So the school six miles away re-buys the same Victorian coat. Coordination
                happens over group texts and lost spreadsheets. And come opening night,
                someone is still hunting for a prop that already exists in the district.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-9 flex flex-wrap gap-x-10 gap-y-5">
                {[
                  ["~$3,100", "wasted per school each year on duplicates"],
                  ["68%", "of inventory never shared between schools"],
                ].map(([stat, label]) => (
                  <div key={stat} className="max-w-[180px]">
                    <div className="lp-tnum text-[28px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                      {stat}
                    </div>
                    <div className="mt-1 text-[13px] leading-snug text-[var(--text-muted)]">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* "In the dark" panel */}
          <Reveal delay={0.1}>
            <div
              className="relative overflow-hidden rounded-[24px] p-7 sm:p-9"
              style={{ background: "var(--stage)" }}
            >
              <div className="flex items-center justify-between">
                <span className="lp-eyebrow" style={{ color: "rgba(250,246,239,0.5)" }}>
                  Storage room · Lincoln High
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-[rgba(250,246,239,0.45)]">
                  <Lock size={12} strokeWidth={1.6} /> Invisible to the district
                </span>
              </div>

              <div className="mt-7 grid grid-cols-3 gap-3">
                {IDLE.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
                      className="rounded-2xl border border-[rgba(250,246,239,0.08)] bg-[rgba(250,246,239,0.04)] p-4"
                    >
                      <Icon size={22} strokeWidth={1.4} style={{ color: "rgba(250,246,239,0.35)" }} />
                      <div className="mt-6 text-[13px] font-medium text-[rgba(250,246,239,0.7)]">
                        {item.label}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[rgba(250,246,239,0.35)]">
                        {item.note}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <div className="mt-6 flex items-center gap-2 text-[12.5px] text-[rgba(250,246,239,0.4)]">
                <span className="h-px flex-1 bg-[rgba(250,246,239,0.12)]" />
                Dust, not data
                <span className="h-px flex-1 bg-[rgba(250,246,239,0.12)]" />
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  )
}
