import type { LucideIcon } from "lucide-react"
import { Shirt, Wand2, ScrollText, Armchair, Lightbulb, Music2, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────
   Resource category system — six theatre production domains, each
   with a restrained warm tint and a thin-line icon.
   ────────────────────────────────────────────────────────────── */
export type CategoryKey =
  | "costumes"
  | "props"
  | "scripts"
  | "sets"
  | "lighting"
  | "sound"

export const CATEGORIES: Record<
  CategoryKey,
  { label: string; icon: LucideIcon; tint: string }
> = {
  costumes: { label: "Costumes", icon: Shirt, tint: "#efe4d6" },
  props: { label: "Props", icon: Wand2, tint: "#fbe6df" },
  scripts: { label: "Scripts", icon: ScrollText, tint: "#e8e8e2" },
  sets: { label: "Set pieces", icon: Armchair, tint: "#e2e7e1" },
  lighting: { label: "Lighting", icon: Lightbulb, tint: "#f4ecd4" },
  sound: { label: "Sound", icon: Music2, tint: "#e5e5eb" },
}

export type Status = "Available" | "On loan" | "Reserved"

export interface Resource {
  title: string
  category: CategoryKey
  school: string
  condition: "Excellent" | "Good" | "Fair"
  status: Status
  /** Optional proximity label, e.g. "2.1 mi" — shown on the card when present. */
  distance?: string
}

const statusDot: Record<Status, string> = {
  Available: "#3a9c63",
  "On loan": "#8a857a",
  Reserved: "var(--ember)",
}

/* Condition is load-bearing on a lending platform — make it a glanceable badge
   instead of tiny right-aligned text. Green = ready, neutral = fine, warm = worn. */
const conditionStyle: Record<Resource["condition"], { bg: string; color: string; border: string }> = {
  Excellent: { bg: "#e9f3ec", color: "#2f7d4f", border: "#cbe6d3" },
  Good: { bg: "var(--bg-subtle)", color: "var(--text-secondary)", border: "var(--border-default)" },
  Fair: { bg: "#f6ecd6", color: "#946316", border: "#e9d7b3" },
}

/* A crafted catalogue tile — the core product object, used across the page.
   When `href` is set the card becomes a link and reveals a "Request" action on
   hover (catalogue / showcase). Without it the card is static — used for the
   hero's decorative floating cluster, where a CTA would be out of place. */
export function ResourceCard({
  resource,
  className = "",
  compact = false,
  href,
}: {
  resource: Resource
  className?: string
  compact?: boolean
  href?: string
}) {
  const cat = CATEGORIES[resource.category]
  const Icon = cat.icon
  const cond = conditionStyle[resource.condition]
  const interactive = Boolean(href)

  const inner = (
    <>
      {/* thumbnail — tightened so it no longer dominates the card. Carries the
          category identity at rest; on hover it becomes the Request affordance. */}
      <div
        className="relative flex items-center justify-center"
        style={{ background: cat.tint, height: compact ? 66 : 92 }}
      >
        <Icon
          size={compact ? 24 : 32}
          strokeWidth={1.4}
          style={{ color: "var(--foreground)", opacity: 0.55 }}
        />

        {/* status — dot only (the label was redundant); name via tooltip + a11y */}
        <span
          role="img"
          aria-label={resource.status}
          title={resource.status}
          className="absolute left-2.5 top-2.5 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--bg-raised)]"
          style={{ background: statusDot[resource.status] }}
        />

        {/* condition — glanceable colored badge */}
        <span
          className="absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold tracking-[-0.01em]"
          style={{ background: cond.bg, color: cond.color, border: `1px solid ${cond.border}` }}
        >
          {resource.condition}
        </span>

        {/* hover CTA — the missing next step, revealed only on interactive cards */}
        {interactive && (
          <span
            className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
            style={{ background: "linear-gradient(to top, rgba(20,18,13,0.18), rgba(20,18,13,0.04))" }}
            aria-hidden
          >
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-sm"
              style={{ background: "var(--ember)" }}
            >
              Request <ArrowRight size={13} strokeWidth={2.4} />
            </span>
          </span>
        )}
      </div>

      {/* body */}
      <div className={cn(compact ? "space-y-1.5 p-3" : "space-y-2 p-4")}>
        <span className="lp-eyebrow !tracking-[0.16em]">{cat.label}</span>
        <h4
          className={cn(
            "font-semibold tracking-[-0.02em] text-[var(--text-primary)]",
            compact ? "text-[14px]" : "text-[16px]"
          )}
        >
          {resource.title}
        </h4>
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="flex min-w-0 items-center gap-1.5">
            <SchoolDot name={resource.school} />
            <span className="truncate text-[12.5px] text-[var(--text-secondary)]">
              {resource.school}
            </span>
          </span>
          {resource.distance && (
            <span className="shrink-0 text-[11.5px] font-medium text-[var(--text-muted)]">
              {resource.distance}
            </span>
          )}
        </div>
      </div>
    </>
  )

  const classes = cn(
    "landing-float-card landing-lift overflow-hidden",
    interactive && "group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ember)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-raised)]",
    className
  )

  return href ? (
    <Link to={href} className={classes} aria-label={`Request ${resource.title}`}>
      {inner}
    </Link>
  ) : (
    <div className={classes}>{inner}</div>
  )
}

/* Small monogram chip for a school. */
export function SchoolDot({ name, size = 18 }: { name: string; size?: number }) {
  const initials = name
    .replace(/\b(High|Middle|Elementary|School|Arts|Academy)\b/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full text-[9px] font-semibold tracking-[-0.02em]"
      style={{
        width: size,
        height: size,
        background: "var(--foreground)",
        color: "var(--primary-foreground)",
      }}
    >
      {initials}
    </span>
  )
}

/* Reusable floating wrapper — gentle perpetual drift for hero clusters. */
export function Float({
  children,
  amplitude = 10,
  duration = 6,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  amplitude?: number
  duration?: number
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      animate={{ y: [0, -amplitude, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
