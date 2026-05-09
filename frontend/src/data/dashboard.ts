import type { ActivityItemProps } from "@/components/dashboard/ActivityItem"

export const dashboardActivity: ActivityItemProps[] = [
  {
    type: "borrow_request",
    title: "Borrow Request",
    description: "Michael Chen requested your Stage Makeup Kit.",
    timeAgo: "10 min ago",
  },
  {
    type: "approved",
    title: "Approved",
    description: "Victorian Costume Set approved for pickup.",
    timeAgo: "1 hr ago",
  },
  {
    type: "message",
    title: "Message",
    description: "James Martinez sent pickup details.",
    timeAgo: "2 hrs ago",
  },
]
