import { StatusDot } from "@/components/common/StatusDot"

export interface ActivityItemProps {
  type: "borrow_request" | "approved" | "message" | "alert"
  title: string
  description: string
  timeAgo: string
  animationDelay?: number
}

export function ActivityItem({
  type,
  title,
  description,
  timeAgo,
  animationDelay = 0,
}: ActivityItemProps) {
  return (
    <article
      className="-mx-4 flex items-start gap-3 px-4 py-3.5 transition-colors duration-200 hover:bg-[var(--bg-overlay)]"
      style={{
        animation: "fadeSlideUp 350ms ease both",
        animationDelay: `${animationDelay}ms`,
      }}
    >
      <StatusDot tone={type} className="mt-[0.45rem]" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="font-label text-[0.6rem] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {title}
          </h3>
          <span className="font-mono text-[0.6rem] uppercase text-[var(--text-muted)]">
            / {timeAgo}
          </span>
        </div>
        <p className="text-[0.82rem] font-light leading-relaxed text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
    </article>
  )
}
