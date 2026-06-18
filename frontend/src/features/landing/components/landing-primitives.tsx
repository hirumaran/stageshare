import { forwardRef, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────
   Container — 1440 max-width content rail with responsive gutters.
   ────────────────────────────────────────────────────────────── */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1320px] px-6 sm:px-8 lg:px-12", className)}>
      {children}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Section — vertical rhythm wrapper (~100px gaps).
   ────────────────────────────────────────────────────────────── */
type SectionProps = React.HTMLAttributes<HTMLElement> & { children: ReactNode }
export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ children, className = "", ...props }, ref) => (
    <section ref={ref} className={cn("py-20 sm:py-28 lg:py-32", className)} {...props}>
      {children}
    </section>
  )
)
Section.displayName = "Section"

/* ──────────────────────────────────────────────────────────────
   Eyebrow — editorial micro-label with an ember tick.
   ────────────────────────────────────────────────────────────── */
export function Eyebrow({
  children,
  className = "",
  onDark = false,
}: {
  children: ReactNode
  className?: string
  onDark?: boolean
}) {
  return (
    <span className={cn("lp-eyebrow inline-flex items-center gap-2.5", className)}>
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "var(--ember)" }}
        aria-hidden
      />
      <span style={onDark ? { color: "rgba(250,246,239,0.6)" } : undefined}>{children}</span>
    </span>
  )
}

/* ──────────────────────────────────────────────────────────────
   Button — obsidian primary, hairline secondary, ember accent,
   ghost link. Pill geometry. Works as <button> or router <Link>.
   ────────────────────────────────────────────────────────────── */
type ButtonVariant = "primary" | "secondary" | "ember" | "ghost"

const baseBtn =
  "group inline-flex items-center justify-center gap-2 rounded-full text-[15px] font-medium tracking-[-0.01em] px-6 py-3 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ember)] focus-visible:ring-offset-[var(--background)] disabled:opacity-50"

const variantBtn: Record<ButtonVariant, string> = {
  primary: "bg-[var(--foreground)] text-[var(--primary-foreground)] hover:bg-[#000]",
  secondary:
    "bg-transparent text-[var(--text-primary)] border border-[var(--border-strong)] hover:border-[var(--foreground)] hover:bg-[var(--bg-subtle)]",
  ember: "bg-[var(--ember)] text-white hover:brightness-[0.94]",
  ghost: "px-0 py-0 text-[var(--text-primary)] hover:text-[var(--ember)] rounded-none",
}

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant
  to?: string
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", to, children, className = "", ...props }, ref) => {
    const classes = cn(baseBtn, variantBtn[variant], className)
    if (to) {
      return (
        <Link to={to} className={classes}>
          {children}
        </Link>
      )
    }
    return (
      <motion.button
        ref={ref}
        whileHover={{ y: -1 }}
        whileTap={{ y: 0 }}
        transition={{ duration: 0.18 }}
        className={classes}
        {...props}
      >
        {children}
      </motion.button>
    )
  }
)
Button.displayName = "Button"

/* ──────────────────────────────────────────────────────────────
   Tag — small category / status pill used on resource cards.
   ────────────────────────────────────────────────────────────── */
export function Tag({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode
  tone?: "neutral" | "ember" | "available"
  className?: string
}) {
  const tones = {
    neutral: "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]",
    ember: "bg-[var(--ember-wash)] text-[#b23a26] border-[#f6cabd]",
    available: "bg-[#e9f3ec] text-[#2f7d4f] border-[#cbe6d3]",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[-0.01em]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
