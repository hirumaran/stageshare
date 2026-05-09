import type { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

export interface StatCardProps {
  label: string
  value: number | string
  icon?: LucideIcon
  variant?: "default" | "accent" | "muted"
  animationDelay?: number
  to: string
}

const numberColorClass: Record<
  NonNullable<StatCardProps["variant"]>,
  string
> = {
  default: "text-[var(--text-primary)]",
  accent: "text-[var(--gold)]",
  muted: "text-[var(--text-secondary)]",
}

export function StatCard({
  label,
  value,
  icon: Icon,
  variant = "default",
  animationDelay = 0,
  to,
}: StatCardProps) {
  return (
    <article
      className="group min-h-[13.5rem] bg-[var(--bg-raised)] transition-colors duration-200 hover:bg-[var(--bg-overlay)] md:min-h-[15rem]"
      style={{
        animation: "fadeSlideUp 350ms ease both",
        animationDelay: `${animationDelay}ms`,
      }}
    >
      <Link
        to={to}
        className="flex h-full cursor-pointer flex-col justify-between p-3 focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] md:p-4"
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-label text-[0.6rem] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {label}
          </h3>
          {Icon && (
            <Icon
              className="h-4 w-4 shrink-0 text-[var(--text-muted)]"
              strokeWidth={1}
              aria-hidden="true"
            />
          )}
        </div>
        <p
          className={cn(
            "font-mono text-[clamp(3rem,5vw,4.5rem)] font-light leading-none tracking-[0.02em] transition-transform [transition-duration:250ms] group-hover:-translate-y-0.5",
            numberColorClass[variant],
          )}
        >
          {value}
        </p>
      </Link>
    </article>
  )
}
