import type { LucideIcon } from "lucide-react"
import { Shirt, Wand2, ScrollText, Armchair, Lightbulb, Music2 } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Tag } from "./landing-primitives"

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
}

const statusTone: Record<Status, "available" | "neutral" | "ember"> = {
  Available: "available",
  "On loan": "neutral",
  Reserved: "ember",
}

const statusDot: Record<Status, string> = {
  Available: "#3a9c63",
  "On loan": "#8a857a",
  Reserved: "var(--ember)",
}

/* A crafted catalogue tile — the core product object, used across the page. */
export function ResourceCard({
  resource,
  className = "",
  compact = false,
}: {
  resource: Resource
  className?: string
  compact?: boolean
}) {
  const cat = CATEGORIES[resource.category]
  const Icon = cat.icon
  return (
    <div
      className={cn(
        "landing-float-card landing-lift overflow-hidden",
        className
      )}
    >
      {/* thumbnail */}
      <div
        className="relative flex items-center justify-center"
        style={{ background: cat.tint, height: compact ? 92 : 132 }}
      >
        <Icon
          size={compact ? 30 : 40}
          strokeWidth={1.4}
          style={{ color: "var(--foreground)", opacity: 0.7 }}
        />
        <div className="absolute left-3 top-3">
          <Tag tone={statusTone[resource.status]}>
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: statusDot[resource.status] }}
            />
            {resource.status}
          </Tag>
        </div>
      </div>
      {/* body */}
      <div className={cn("space-y-2", compact ? "p-3" : "p-4")}>
        <div className="flex items-center justify-between gap-2">
          <span className="lp-eyebrow !tracking-[0.16em]">{cat.label}</span>
          <span className="text-[11px] text-[var(--text-muted)]">{resource.condition}</span>
        </div>
        <h4
          className={cn(
            "font-semibold tracking-[-0.02em] text-[var(--text-primary)]",
            compact ? "text-[14px]" : "text-[16px]"
          )}
        >
          {resource.title}
        </h4>
        <div className="flex items-center gap-1.5 pt-0.5">
          <SchoolDot name={resource.school} />
          <span className="truncate text-[12.5px] text-[var(--text-secondary)]">
            {resource.school}
          </span>
        </div>
      </div>
    </div>
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
