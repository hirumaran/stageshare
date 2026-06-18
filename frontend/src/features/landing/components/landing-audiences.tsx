import { motion } from "framer-motion"
import { Check, CheckCircle2, ShieldCheck, Calendar } from "lucide-react"
import { Container, Section, Eyebrow, Button } from "./landing-primitives"
import { Reveal, Stagger, StaggerItem } from "./landing-motion"
import { SchoolDot } from "./landing-ui"

function Bullets({ items }: { items: string[] }) {
  return (
    <Stagger as="ul" stagger={0.07} delay={0.1} className="mt-7 space-y-3.5">
      {items.map((it) => (
        <StaggerItem as="li" key={it} y={12} className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--ember-wash)" }}
          >
            <Check size={13} strokeWidth={2.4} style={{ color: "#b23a26" }} />
          </span>
          <span className="text-[15.5px] leading-[1.5] text-[var(--text-secondary)]">{it}</span>
        </StaggerItem>
      ))}
    </Stagger>
  )
}

/* ── Teachers: coordination thread visual ── */
function TeacherVisual() {
  return (
    <div className="landing-float-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <span className="lp-eyebrow">Borrow request</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e9f3ec] px-2.5 py-1 text-[11px] font-medium text-[#2f7d4f]">
          <CheckCircle2 size={12} strokeWidth={2} /> Approved
        </span>
      </div>
      <h4 className="mt-3 text-[18px] font-semibold tracking-[-0.025em] text-[var(--text-primary)]">
        Victorian Frock Coat
      </h4>
      <p className="text-[13px] text-[var(--text-muted)]">Lincoln High → Jefferson High</p>

      <div className="mt-5 space-y-3">
        <div className="flex items-start gap-2.5">
          <SchoolDot name="Jefferson High" size={26} />
          <div className="rounded-2xl rounded-tl-md bg-[var(--bg-subtle)] px-3.5 py-2.5 text-[13.5px] leading-snug text-[var(--text-secondary)]">
            Could we borrow this for our spring run, Mar 12–24?
          </div>
        </div>
        <div className="flex flex-row-reverse items-start gap-2.5">
          <SchoolDot name="Lincoln High" size={26} />
          <div
            className="rounded-2xl rounded-tr-md px-3.5 py-2.5 text-[13.5px] leading-snug text-[var(--primary-foreground)]"
            style={{ background: "var(--foreground)" }}
          >
            Of course — it's yours. Pickup at the costume shop?
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-3">
        <Calendar size={18} strokeWidth={1.7} style={{ color: "var(--ember)" }} />
        <div className="leading-tight">
          <div className="text-[13.5px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            Handoff scheduled
          </div>
          <div className="text-[12px] text-[var(--text-muted)]">Friday · 3:30 PM · Returns Mar 26</div>
        </div>
      </div>
    </div>
  )
}

/* ── Districts: overview panel visual ── */
const SCHOOLS = [
  { name: "Lincoln High", util: 0.82, items: 214 },
  { name: "Jefferson High", util: 0.64, items: 176 },
  { name: "Roosevelt Middle", util: 0.71, items: 98 },
  { name: "Edison Arts", util: 0.55, items: 133 },
]

function DistrictVisual() {
  return (
    <div className="landing-float-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="lp-eyebrow">District overview</span>
          <h4 className="mt-2 text-[18px] font-semibold tracking-[-0.025em] text-[var(--text-primary)]">
            Mapleton District
          </h4>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
          <ShieldCheck size={12} strokeWidth={1.8} /> Admin
        </span>
      </div>

      <div className="mt-5 space-y-3.5">
        {SCHOOLS.map((s, i) => (
          <div key={s.name} className="flex items-center gap-3">
            <SchoolDot name={s.name} size={28} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="truncate text-[13.5px] font-medium tracking-[-0.01em] text-[var(--text-primary)]">
                  {s.name}
                </span>
                <span className="lp-tnum text-[12px] text-[var(--text-muted)]">{s.items} items</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${s.util * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full"
                  style={{ background: i === 0 ? "var(--ember)" : "var(--foreground)" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between rounded-2xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-3">
        <span className="text-[12.5px] text-[var(--text-muted)]">District utilization</span>
        <span className="lp-tnum text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          +43%
        </span>
      </div>
    </div>
  )
}

export function LandingAudiences() {
  return (
    <>
      {/* Teachers */}
      <Section id="teachers" className="scroll-mt-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="order-2 lg:order-1">
              <Reveal>
                <TeacherVisual />
              </Reveal>
            </div>
            <div className="order-1 max-w-xl lg:order-2">
              <Reveal>
                <Eyebrow>For teachers &amp; directors</Eyebrow>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-5 text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-[var(--text-primary)]">
                  Spend your time directing, not digging.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-5 text-[16.5px] leading-[1.65] text-[var(--text-secondary)]">
                  Clio gives you the whole district's inventory at your fingertips, and a
                  calm way to borrow what you need — without the group-text chaos.
                </p>
              </Reveal>
              <Bullets
                items={[
                  "Digitize your storage once — photos, condition, location, categories.",
                  "Find any costume, prop, or script available across the district in seconds.",
                  "Coordinate borrows, handoffs, and returns in one tidy thread.",
                  "Plan a production around what you can actually get your hands on.",
                ]}
              />
              <Reveal delay={0.2}>
                <Button to="/signup" variant="secondary" className="mt-8">
                  Start with your closet
                </Button>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* Districts */}
      <Section id="districts" className="scroll-mt-24 bg-[var(--bg-subtle)]">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="max-w-xl">
              <Reveal>
                <Eyebrow>For district administrators</Eyebrow>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-5 text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-[var(--text-primary)]">
                  See the whole stage from one seat.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-5 text-[16.5px] leading-[1.65] text-[var(--text-secondary)]">
                  Give every arts program a shared backbone — with the oversight, control,
                  and reporting that justifies the budget at the next board meeting.
                </p>
              </Reveal>
              <Bullets
                items={[
                  "Onboard and manage every school's program from one console.",
                  "Control users, roles, and permissions with district-wide policy.",
                  "Report on utilization, savings, and cross-school collaboration.",
                  "Turn duplicate spending into shared assets — and prove the ROI.",
                ]}
              />
              <Reveal delay={0.2}>
                <Button to="/signup" variant="secondary" className="mt-8">
                  Book a district walkthrough
                </Button>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <DistrictVisual />
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  )
}
