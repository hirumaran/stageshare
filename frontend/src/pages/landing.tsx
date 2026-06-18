import { MotionConfig } from "framer-motion"
import { ScrollProgress } from "@/features/landing/components/landing-motion"
import { LandingNav } from "@/features/landing/components/landing-nav"
import { LandingHero } from "@/features/landing/components/landing-hero"
import { LandingLogos } from "@/features/landing/components/landing-logos"
import { LandingProblem } from "@/features/landing/components/landing-problem"
import { LandingShowcase } from "@/features/landing/components/landing-showcase"
import { LandingAudiences } from "@/features/landing/components/landing-audiences"
import { LandingAnalytics } from "@/features/landing/components/landing-analytics"
import { LandingTestimonial } from "@/features/landing/components/landing-testimonial"
import { LandingCta } from "@/features/landing/components/landing-cta"
import { LandingFooter } from "@/features/landing/components/landing-footer"

/**
 * Public landing page for Clio — "The Working Theatre".
 *
 * A cinematic performing-arts gallery: warm cream canvas, obsidian editorial
 * type, white elevated product cards, hairline warm borders, and one ember
 * accent that reads as stage light. The page tells a story — valuable theatre
 * resources sitting in the dark, the coordination chaos, Clio connecting every
 * department, and every production becoming easier to plan.
 *
 * Theme tokens are scoped to .landing-root (see index.css) so the landing
 * never inverts with the app's dark mode.
 */
export default function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="landing-root min-h-screen">
        <ScrollProgress />
        <LandingNav />
        <main className="relative z-10">
          <LandingHero />
          <LandingLogos />
          <LandingProblem />
          <LandingShowcase />
          <LandingAudiences />
          <LandingAnalytics />
          <LandingTestimonial />
          <LandingCta />
        </main>
        <LandingFooter />
      </div>
    </MotionConfig>
  )
}
