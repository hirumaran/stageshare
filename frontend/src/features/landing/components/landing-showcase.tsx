import { motion } from "framer-motion"
import { Search, SlidersHorizontal, Camera, Compass, Send, RotateCcw } from "lucide-react"
import { Container, Section, Eyebrow } from "./landing-primitives"
import { Reveal } from "./landing-motion"
import { ResourceCard, CATEGORIES, type Resource, type CategoryKey } from "./landing-ui"

const CATALOGUE: Resource[] = [
  { title: "Victorian Frock Coat", category: "costumes", school: "Lincoln High", condition: "Excellent", status: "Available", distance: "2.1 mi" },
  { title: "Fog Machine X-400", category: "sound", school: "Roosevelt Middle", condition: "Good", status: "On loan", distance: "4.0 mi" },
  { title: "Gilded Throne", category: "sets", school: "Edison Arts", condition: "Fair", status: "Available", distance: "1.3 mi" },
  { title: "LED PAR Wash Kit ×6", category: "lighting", school: "Lincoln High", condition: "Excellent", status: "Reserved", distance: "2.1 mi" },
  { title: "Hamlet — 24 scripts", category: "scripts", school: "Jefferson High", condition: "Good", status: "Available", distance: "3.4 mi" },
  { title: "Fairy Wings, pair", category: "props", school: "Edison Arts", condition: "Good", status: "Available", distance: "0.8 mi" },
]

const STEPS = [
  {
    icon: Camera,
    title: "Digitize the closet",
    body: "Snap a photo, log condition, location, and category. Your whole storage room becomes a searchable catalogue in an afternoon.",
  },
  {
    icon: Compass,
    title: "Discover across schools",
    body: "Search one shared district catalogue. See what's available right now — and who has the thing you've been about to buy.",
  },
  {
    icon: Send,
    title: "Request & hand off",
    body: "Request a borrow in a tap. Message the owning teacher, agree on a handoff, and keep the whole conversation tied to the loan.",
  },
  {
    icon: RotateCcw,
    title: "Track & return",
    body: "Due dates, reminders, and condition checks keep every loan accountable — so things come back the way they left.",
  },
]

const FILTER_KEYS: CategoryKey[] = ["costumes", "props", "scripts", "sets", "lighting", "sound"]

export function LandingShowcase() {
  return (
    <Section id="how" className="scroll-mt-24">
      <Container>
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-[var(--text-primary)]">
              From dark storage room to district-wide stage.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-[17px] leading-[1.65] text-[var(--text-secondary)]">
              Clio gives every department one connected catalogue. The gear stops hiding,
              the borrowing gets simple, and every production starts with what the district
              already owns.
            </p>
          </Reveal>
        </div>

        {/* ── Crafted product UI: the district catalogue ── */}
        <Reveal delay={0.1}>
          <div className="landing-float-card mt-12 overflow-hidden p-0">
            {/* window chrome */}
            <div className="flex items-center gap-3 border-b border-[var(--border-default)] px-4 py-3 sm:px-5">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#e7e0d2]" />
                <span className="h-3 w-3 rounded-full bg-[#e7e0d2]" />
                <span className="h-3 w-3 rounded-full bg-[#e7e0d2]" />
              </div>
              <div className="mx-auto flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-1 text-[12px] text-[var(--text-muted)]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ember)" }} />
                clio.app / catalogue
              </div>
            </div>

            <div className="grid lg:grid-cols-[200px_1fr]">
              {/* category rail */}
              <aside className="hidden flex-col gap-1 border-r border-[var(--border-default)] p-4 lg:flex">
                <span className="lp-eyebrow mb-2 px-2">Categories</span>
                {FILTER_KEYS.map((key, i) => {
                  const cat = CATEGORIES[key]
                  const Icon = cat.icon
                  const active = i === 0
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-xl px-2.5 py-2 text-[13.5px] transition-colors"
                      style={{
                        background: active ? "var(--bg-subtle)" : "transparent",
                        color: active ? "var(--text-primary)" : "var(--text-secondary)",
                        fontWeight: active ? 600 : 500,
                      }}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon size={16} strokeWidth={1.6} />
                        {cat.label}
                      </span>
                      <span className="lp-tnum text-[11px] text-[var(--text-muted)]">
                        {[214, 96, 58, 41, 73, 39][i]}
                      </span>
                    </div>
                  )
                })}
              </aside>

              {/* content */}
              <div className="p-4 sm:p-5">
                {/* toolbar */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex flex-1 items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-[13.5px] text-[var(--text-muted)]">
                    <Search size={15} strokeWidth={1.8} />
                    Search 521 resources across 12 schools…
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-[var(--border-default)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--text-secondary)]">
                    <SlidersHorizontal size={14} strokeWidth={1.8} />
                    Filters
                  </div>
                </div>

                {/* status chips */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Available now", "Within 5 miles", "Excellent condition"].map((c, i) => (
                    <span
                      key={c}
                      className="rounded-full border px-3 py-1 text-[12px] font-medium tracking-[-0.01em]"
                      style={
                        i === 0
                          ? { background: "var(--ember-wash)", color: "#b23a26", borderColor: "#f6cabd" }
                          : { borderColor: "var(--border-default)", color: "var(--text-secondary)" }
                      }
                    >
                      {c}
                    </span>
                  ))}
                </div>

                {/* grid */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {CATALOGUE.map((r, i) => (
                    <motion.div
                      key={r.title}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.5, delay: i * 0.06 }}
                    >
                      <ResourceCard resource={r} compact href="/signup" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── Borrow lifecycle ── */}
        <div className="relative mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* connector line on desktop */}
          <div
            className="absolute left-0 right-0 top-7 hidden h-px lg:block"
            style={{ background: "var(--border-default)" }}
            aria-hidden
          />
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <Reveal key={s.title} delay={i * 0.08} className="relative">
                <div className="flex items-center gap-3">
                  <div
                    className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)" }}
                  >
                    <Icon size={22} strokeWidth={1.6} style={{ color: "var(--text-primary)" }} />
                    <span
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                      style={{ background: "var(--ember)" }}
                    >
                      {i + 1}
                    </span>
                  </div>
                </div>
                <h3 className="mt-5 text-[18px] font-semibold tracking-[-0.025em] text-[var(--text-primary)]">
                  {s.title}
                </h3>
                <p className="mt-2 text-[14.5px] leading-[1.6] text-[var(--text-secondary)]">
                  {s.body}
                </p>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
