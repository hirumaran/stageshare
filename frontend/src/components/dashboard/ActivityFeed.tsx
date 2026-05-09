import { ArrowRight, RefreshCw } from "lucide-react"
import { Link } from "react-router-dom"
import { ActivityItem, type ActivityItemProps } from "./ActivityItem"
import { useStaggeredEntrance } from "@/hooks/useStaggeredEntrance"

interface ActivityFeedProps {
  items: ActivityItemProps[]
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  const entrance = useStaggeredEntrance(420, 0)

  return (
    <section className="mt-16 border-t border-[var(--border-subtle)] pt-6 md:mt-20">
      <div
        className="mb-5 flex items-center justify-between gap-4"
        style={entrance(0, 400)}
      >
        <div className="flex items-center gap-2.5">
          <RefreshCw
            className="h-4 w-4 text-[var(--text-muted)] [animation:spinSlow_8s_linear_infinite]"
            strokeWidth={1}
            aria-hidden="true"
          />
          <h2 className="font-label text-[0.65rem] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Recent Activity
          </h2>
        </div>
        <Link
          to="/notifications"
          className="inline-flex items-center gap-2 font-label text-[0.6rem] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)]"
        >
          View All
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1} />
        </Link>
      </div>

      <div className="divide-y divide-[var(--border-subtle)]">
        {items.map((item, index) => (
          <ActivityItem
            key={`${item.type}-${item.timeAgo}`}
            {...item}
            animationDelay={520 + index * 30}
          />
        ))}
      </div>
    </section>
  )
}
