import { Container, Section, Eyebrow } from "./landing-primitives"
import { Reveal } from "./landing-motion"
import { SchoolDot } from "./landing-ui"

const FEATURE = {
  quote:
    "We found out the middle school across town had the exact Edwardian set dressing we were about to spend our whole budget rebuilding. Clio paid for itself before our first production even opened.",
  name: "Dana Whitfield",
  role: "Theatre Director · Lincoln High School",
}

const SUPPORTING = [
  {
    quote:
      "Cataloguing felt like a chore until I realized I'd never lose track of a costume again. Now I plan a season around what I can actually borrow.",
    name: "Marcus Lee",
    role: "Drama Teacher · Roosevelt Middle",
  },
  {
    quote:
      "For the first time I can show the board exactly what our arts programs share — and what they save. It made our funding conversation easy.",
    name: "Priya Nandakumar",
    role: "Arts Coordinator · Mapleton District",
  },
]

export function LandingTestimonial() {
  return (
    <Section className="bg-[var(--bg-subtle)]">
      <Container>
        <Reveal>
          <Eyebrow>Loved by theatre educators</Eyebrow>
        </Reveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-12">
          {/* Feature quote */}
          <Reveal delay={0.05} className="lg:col-span-7">
            <figure className="landing-float-card flex h-full flex-col justify-between p-8 sm:p-10">
              <span
                className="text-[64px] font-semibold leading-[0.5]"
                style={{ color: "var(--ember)" }}
                aria-hidden
              >
                &ldquo;
              </span>
              <blockquote className="mt-4 text-[clamp(1.25rem,2.2vw,1.7rem)] font-medium leading-[1.32] tracking-[-0.025em] text-[var(--text-primary)]">
                {FEATURE.quote}
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-3">
                <SchoolDot name={FEATURE.name} size={36} />
                <div>
                  <div className="text-[14.5px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                    {FEATURE.name}
                  </div>
                  <div className="text-[13px] text-[var(--text-muted)]">{FEATURE.role}</div>
                </div>
              </figcaption>
            </figure>
          </Reveal>

          {/* Supporting quotes */}
          <div className="grid gap-4 lg:col-span-5">
            {SUPPORTING.map((t, i) => (
              <Reveal key={t.name} delay={0.1 + i * 0.08}>
                <figure className="landing-float-card flex flex-col p-6">
                  <blockquote className="text-[15px] leading-[1.55] tracking-[-0.01em] text-[var(--text-secondary)]">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-2.5">
                    <SchoolDot name={t.name} size={30} />
                    <div>
                      <div className="text-[13.5px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                        {t.name}
                      </div>
                      <div className="text-[12px] text-[var(--text-muted)]">{t.role}</div>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  )
}
