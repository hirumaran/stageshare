import { StatCard, type StatCardProps } from "./StatCard"

interface StatCardGridProps {
  metrics: StatCardProps[]
}

export function StatCardGrid({ metrics }: StatCardGridProps) {
  const [
    resourcesShared,
    unreadAlerts,
    pendingRequests,
    borrowedItems,
    unreadMessages,
  ] = metrics

  return (
    <section className="bg-[var(--border-subtle)] p-px">
      <div className="grid gap-px bg-[var(--border-subtle)] md:grid-cols-2">
        <StatCard {...resourcesShared} animationDelay={300} />
        <StatCard {...unreadAlerts} animationDelay={350} />
      </div>
      <div className="mt-px grid gap-px bg-[var(--border-subtle)] md:grid-cols-3">
        <StatCard {...pendingRequests} animationDelay={400} />
        <StatCard {...borrowedItems} animationDelay={450} />
        <StatCard {...unreadMessages} animationDelay={500} />
      </div>
    </section>
  )
}
