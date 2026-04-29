import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion, useScroll, useTransform, useMotionValue, useSpring, useInView, useVelocity } from "framer-motion"
import { useRef, useEffect, useState, useCallback, useMemo } from "react"
import {
  ArrowRight,
  ArrowDown,
  Theater,
} from "lucide-react"

/* ─── CTA Spotlight section wrapper ─── */
function CTASpotlightSection({ children }: { children: React.ReactNode }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const dimRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const glow = glowRef.current
    const dim = dimRef.current
    if (!section || !glow || !dim) return

    const handleMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      glow.style.left = `${x}px`
      glow.style.top = `${y}px`
    }

    const handleEnter = () => {
      glow.style.opacity = '1'
      dim.style.opacity = '0.12'
    }

    const handleLeave = () => {
      glow.style.opacity = '0'
      dim.style.opacity = '0'
    }

    section.addEventListener('mousemove', handleMove)
    section.addEventListener('mouseenter', handleEnter)
    section.addEventListener('mouseleave', handleLeave)

    return () => {
      section.removeEventListener('mousemove', handleMove)
      section.removeEventListener('mouseenter', handleEnter)
      section.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  return (
    <section ref={sectionRef} className="border-t border-border relative overflow-hidden">
      <div ref={dimRef} className="cta-dim-overlay" />
      <div ref={glowRef} className="cta-spotlight-glow" />
      {children}
    </section>
  )
}

/* ─── Scroll progress bar ─── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-foreground origin-left"
      style={{ scaleX }}
    />
  )
}

/* ─── Split text reveal (GSAP SplitText style) ─── */
function SplitReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const words = text.split(" ")

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em] pb-[0.15em]">
          <motion.span
            className="inline-block"
            initial={{ y: "100%" }}
            animate={isInView ? { y: 0 } : {}}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              delay: delay + i * 0.04,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/* ─── Character-by-character decode (anime.js style) ─── */
function TypeReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })
  const chars = text.split("")

  return (
    <span ref={ref} className={className}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1],
            delay: delay + i * 0.015,
          }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </span>
  )
}

/* ─── Magnetic button wrapper ─── */
function MagneticButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 15 })
  const springY = useSpring(y, { stiffness: 150, damping: 15 })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.15)
    y.set((e.clientY - centerY) * 0.15)
  }, [x, y])

  const handleMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── 3-Tier Catalogue Visualization (hero right side) ─── */
function CatalogueDiagram() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true })

  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-auto select-none" aria-hidden="true">
      {/* Card 1 — Department Submissions */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-xl p-5"
        style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <i className="ph ph-upload-simple" style={{ color: '#D4845E', fontSize: '14px' }} />
          <span
            className="font-sans uppercase tracking-widest"
            style={{ color: '#B0B0B0', fontSize: '11px', letterSpacing: '0.15em', fontWeight: 500 }}
          >
            Department Submissions
          </span>
        </div>
        <div className="flex gap-2">
          {[
            { icon: 'ph-file-text', label: 'Script' },
            { icon: 'ph-armchair', label: 'Couch' },
            { icon: 'ph-t-shirt', label: 'Jacket' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px]"
              style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              <i className={`ph ${s.icon}`} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }} />
              {s.label}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Connector */}
      <div className="flex justify-center my-1">
        <motion.div
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : {}}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="w-px origin-top"
          style={{ height: '20px', background: 'rgba(255,255,255,0.1)' }}
        />
      </div>

      {/* Card 2 — Skēnē Curated Catalogue */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-xl p-5"
        style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <p
          className="font-sans uppercase tracking-widest text-center mb-4"
          style={{ color: '#B0B0B0', fontSize: '11px', letterSpacing: '0.15em', fontWeight: 500 }}
        >
          Skēnē Curated Catalogue
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { icon: 'ph-t-shirt', title: 'Period Dresses', count: '120+ items', accent: '#4A7C59' },
            { icon: 'ph-book-open', title: 'One-Acts', count: '80+ scripts', accent: '#4A6FA5' },
            { icon: 'ph-lamp', title: 'Standard Furniture', count: '45+ pieces', accent: '#C45D3A' },
            { icon: 'ph-armchair', title: 'Stage Props', count: '200+ items', accent: '#6B8F5E' },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.35, delay: 0.45 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-lg p-3 group"
              style={{
                background: '#1A1A1A',
                border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: `2px solid ${c.accent}`,
              }}
            >
              <i className={`ph ${c.icon}`} style={{ color: c.accent, fontSize: '16px', marginBottom: '8px', display: 'block' }} />
              <p className="font-display font-medium leading-tight" style={{ color: '#E5E4E0', fontSize: '12px' }}>
                {c.title}
              </p>
              <p className="font-sans mt-0.5" style={{ color: '#7A7A7A', fontSize: '10px' }}>
                {c.count}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Connector */}
      <div className="flex justify-center my-1">
        <motion.div
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : {}}
          transition={{ duration: 0.3, delay: 0.7 }}
          className="w-px origin-top"
          style={{ height: '20px', background: 'rgba(255,255,255,0.1)' }}
        />
      </div>

      {/* Card 3 — Access & Booking */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-xl p-5"
        style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <i className="ph ph-calendar-blank" style={{ color: '#4A6FA5', fontSize: '14px' }} />
          <span
            className="font-sans uppercase tracking-widest"
            style={{ color: '#B0B0B0', fontSize: '11px', letterSpacing: '0.15em', fontWeight: 500 }}
          >
            Access & Booking
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 flex-1 rounded-md px-3 py-2 truncate"
            style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <i className="ph ph-magnifying-glass" style={{ color: '#7A7A7A', fontSize: '12px', flexShrink: 0 }} />
            <span className="font-sans truncate" style={{ color: '#7A7A7A', fontSize: '11px' }}>
              Search catalogue...
            </span>
          </div>
          <div
            className="font-sans font-medium rounded-md px-3 py-1.5 whitespace-nowrap"
            style={{
              background: 'rgba(74, 111, 165, 0.15)',
              border: '1px solid rgba(74,111,165,0.4)',
              color: '#4A6FA5',
              fontSize: '11px',
            }}
          >
            Request Item
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Scroll-driven horizontal parallax row ─── */
function ParallaxSchools() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const x = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"])

  const schools = useMemo(() => ["Big Picture", "Newport", "Sammamish", "Big Picture", "Newport", "Sammamish"], [])

  return (
    <section ref={ref} className="border-t border-border overflow-hidden py-20 md:py-28">
      <div className="container mb-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-sm font-sans uppercase tracking-widest text-muted-foreground"
        >
          Trusted by
        </motion.p>
      </div>
      <motion.div style={{ x }} className="flex gap-x-16 md:gap-x-24 whitespace-nowrap">
        {schools.map((school, i) => (
          <span
            key={`${school}-${i}`}
            className="school-watermark text-4xl md:text-6xl lg:text-7xl"
          >
            {school}
          </span>
        ))}
      </motion.div>
    </section>
  )
}

/* ─── Scroll-velocity skew effect wrapper ─── */
function SkewOnScroll({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const skew = useTransform(velocity, [-2000, 2000], [-3, 3])
  const springSkew = useSpring(skew, { stiffness: 80, damping: 20 })

  return (
    <motion.div ref={ref} style={{ skewY: springSkew }} className={className}>
      {children}
    </motion.div>
  )
}

/* ─── Data ─── */
const STEPS = [
  { num: "01", title: "Browse", body: "Search the catalogue by category, keyword, or school district." },
  { num: "02", title: "Request", body: "Pick your dates, send a request, message the owner directly." },
  { num: "03", title: "Return", body: "Use it for your production, return it, leave a review." },
] as const

const CATEGORIES = [
  { label: "Costumes", count: "840+" },
  { label: "Props", count: "620+" },
  { label: "Set Pieces", count: "320+" },
  { label: "Lighting", count: "190+" },
  { label: "Sound", count: "150+" },
  { label: "Scripts", count: "340+" },
] as const

export default function LandingPage() {
  const beliefRef = useRef(null)

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ScrollProgress />

      {/* Nav */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-background/95 backdrop-blur"
      >
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-display text-xl tracking-tight">
            <Theater className="h-5 w-5 text-primary" />
            Skēnē
          </Link>
          <nav className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex text-muted-foreground hover:text-foreground font-sans">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild className="font-sans font-medium">
              <Link to="/signup">Get started</Link>
            </Button>
          </nav>
        </div>
      </motion.header>

      {/* Hero — split layout, full width */}
      <section className="container pt-32 pb-12 md:pt-40 md:pb-20 min-h-[90vh] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center w-full">
          {/* Left: text */}
          <div className="max-w-xl">
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="mb-6 text-xs font-sans font-medium uppercase tracking-widest text-muted-foreground"
            >
              A resource library for high school drama departments
            </motion.p>

            <h1 className="font-display text-[clamp(2.8rem,7vw,6rem)] leading-[1.1] tracking-tight pb-[0.1em]">
              <SplitReveal text="A shared resource library" delay={0.2} />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
              className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground"
            >
              Borrow, lend, and track props, costumes, and set pieces across your district. Built for teachers at Big Picture, Newport, Sammamish, and beyond.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
              className="mt-10 flex items-center gap-6"
            >
              <MagneticButton>
                <Button size="lg" asChild className="font-sans font-medium">
                  <Link to="/signup">
                    Get started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </MagneticButton>
              <Link
                to="/catalogue"
                className="group inline-flex items-center gap-1.5 text-sm font-sans text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse catalogue
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">[ → ]</span>
              </Link>
            </motion.div>
          </div>

          {/* Right: catalogue diagram */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="hidden lg:block"
          >
            <CatalogueDiagram />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-12 md:mt-16"
        >
          <Link
            to="#belief"
            className="group inline-flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Scroll
            <motion.span
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </motion.span>
          </Link>
        </motion.div>
      </section>

      {/* Belief — "SHARING" as focal point with scroll-linked parallax */}
      <section id="belief" ref={beliefRef} className="relative border-t border-border">
        <div className="container py-24 md:py-32 text-center relative z-10">
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-sm font-sans uppercase tracking-widest text-muted-foreground mb-8"
          >
            What we believe
          </motion.p>

          {/* Giant "SHARING" */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            <h2 className="font-honk text-[clamp(4rem,18vw,14rem)] leading-[1.0]">
              SHARING
            </h2>
          </motion.div>

          {/* Staggered content reveal below */}
          <div className="mt-16 md:mt-20 max-w-2xl mx-auto space-y-6">
            <p className="font-display text-xl md:text-2xl lg:text-3xl leading-snug tracking-tight">
              <SplitReveal text="With trust, we help drama teachers do more with less." delay={0.15} />
            </p>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              className="text-base md:text-lg leading-relaxed text-muted-foreground"
            >
              Every department has a closet full of props gathering dust. Skēnē turns those closets into a shared network — so you spend less of your budget on things you use once, and more on what matters.
            </motion.p>
          </div>
        </div>
      </section>

      {/* How it works — with scroll velocity skew */}
      <SkewOnScroll>
        <section id="how-it-works" className="border-t border-border">
          <div className="container py-24 md:py-36">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-12 md:mb-16"
            >
              <p className="text-sm font-sans uppercase tracking-widest text-muted-foreground">
                How it works
              </p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Borrowing should be as simple as asking a colleague down the hall.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.num}
                  initial={{ opacity: 0, y: 30, rotateX: -8 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 }}
                  className="step-card perspective-1000"
                >
                  <span className="font-display text-sm text-muted-foreground block mb-6">{s.num}</span>
                  <h3 className="font-display text-xl md:text-2xl tracking-tight">
                    <SplitReveal text={s.title} delay={i * 0.12} />
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </SkewOnScroll>

      {/* Categories — character-by-character type reveal */}
      <section className="border-t border-border overflow-hidden">
        <div className="container py-24 md:py-36">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-sm md:text-base font-sans uppercase tracking-widest text-muted-foreground">
                Community catalogue
              </p>
              <p className="mt-6 max-w-sm text-base md:text-lg leading-relaxed text-muted-foreground">
                Thousands of items, shared by teachers like you. Search by category, school, or production.
              </p>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-10"
              >
                <Link
                  to="/catalogue"
                  className="group inline-flex items-center gap-2 text-base md:text-lg font-sans text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all items
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border group-hover:border-foreground group-hover:bg-foreground group-hover:text-background transition-all">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </motion.div>
            </motion.div>

            <div>
              {CATEGORIES.map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
                  whileHover={{ x: 8, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
                  className="group flex items-baseline justify-between py-6 border-b border-border cursor-pointer"
                >
                  <span className="font-display text-xl md:text-2xl tracking-tight transition-colors group-hover:text-primary">
                    <TypeReveal text={c.label} delay={i * 0.06} />
                  </span>
                  <span className="text-sm font-sans text-muted-foreground tabular-nums">{c.count}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Schools — scroll-driven horizontal parallax */}
      <ParallaxSchools />

      {/* CTA — single instance, full width */}
      <CTASpotlightSection>
        <div className="container py-28 md:py-44 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="max-w-4xl relative z-10"
          >
            <p className="text-sm md:text-base font-sans uppercase tracking-widest text-muted-foreground mb-8 md:mb-10">
              Get started
            </p>
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl xl:text-8xl leading-[0.95] tracking-tight">
              <SplitReveal text="Ready to share the stage?" delay={0.1} />
            </h2>
            <p className="mt-8 md:mt-10 max-w-xl text-base md:text-lg leading-relaxed text-muted-foreground">
              Join the teachers already lending, borrowing, and building stronger programs together.
            </p>
            <div className="mt-12 md:mt-14 flex flex-wrap items-center gap-8">
              <MagneticButton>
                <Button size="lg" asChild className="font-sans font-medium text-base px-8 py-6">
                  <Link to="/signup">
                    Create a free account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </MagneticButton>
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 text-base font-sans text-muted-foreground hover:text-foreground transition-colors"
              >
                Already have an account? Sign in
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border group-hover:border-foreground group-hover:bg-foreground group-hover:text-background transition-all">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </CTASpotlightSection>

      {/* Footer — Antigravity Mega-Footer */}
      <footer className="border-t border-border">
        {/* Giant edge-to-edge text */}
        <div className="footer-graphic border-b border-border">
          <motion.span
            className="footer-bg-text font-display"
            aria-hidden="true"
            animate={{ x: ["-3%", "3%"], opacity: [0.4, 0.7] }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          >
            Skēnē
          </motion.span>
        </div>

        {/* Standard footer row */}
        <div className="container py-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4 text-[0.875rem] text-muted-foreground font-sans">
            <p className="md:w-1/3 md:text-left">&copy; {new Date().getFullYear()} Skēnē</p>

            <nav className="md:w-1/3 flex flex-wrap justify-center gap-x-6 gap-y-1">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <Link to="/catalogue" className="hover:text-foreground transition-colors">Catalogue</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </nav>

            <p className="md:w-1/3 md:text-right">Built for drama teachers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
