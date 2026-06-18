import { Marquee, Reveal } from "./landing-motion"
import { Container } from "./landing-primitives"

const DISTRICTS = [
  "Mapleton District",
  "Riverside USD",
  "Northgate Schools",
  "Cedar Valley",
  "Harborview ISD",
  "Westbrook County",
  "Summit Public",
  "Fairhaven Arts",
]

export function LandingLogos() {
  return (
    <section id="proof" className="border-y border-[var(--border-default)] py-12 sm:py-14">
      <Container>
        <Reveal>
          <p className="mb-9 text-center text-[13px] tracking-[-0.01em] text-[var(--text-muted)]">
            Trusted by drama departments across{" "}
            <span className="font-medium text-[var(--text-secondary)]">40+ school districts</span>
          </p>
        </Reveal>
        <Marquee speed={48}>
          {DISTRICTS.map((d) => (
            <span
              key={d}
              className="select-none whitespace-nowrap text-[19px] font-semibold tracking-[-0.03em] text-[var(--text-primary)] opacity-45 transition-opacity duration-300 hover:opacity-100"
            >
              {d}
            </span>
          ))}
        </Marquee>
      </Container>
    </section>
  )
}
