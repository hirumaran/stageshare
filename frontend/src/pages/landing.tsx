import { MotionConfig } from "framer-motion"
import { ScrollProgress } from "@/features/landing/components/landing-motion"
import { ThemePullChain } from "@/features/landing/components/landing-theme-chain"
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
        {/* Top fade scrim — dissolves page content into the canvas before it
            reaches the floating nav, so the full-bleed proof marquee (and any
            bright section) can't bleed through the frosted glass or flicker
            behind its backdrop-blur as it scrolls past. Sits above the content
            (z-10) but below the pull-chain (z-40) and nav (z-50), so it masks
            the bleed without clipping either. Pure page-bg, so it's invisible
            over the dark canvas and only reads as a fade where content meets it. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-30 h-32"
          style={{
            background:
              "linear-gradient(to bottom, var(--bg-base) 0%, var(--bg-base) 56%, transparent 100%)",
          }}
        />
        <ThemePullChain />
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
