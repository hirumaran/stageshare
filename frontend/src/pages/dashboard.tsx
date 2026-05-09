import {
  AlertTriangle,
  ArrowLeftRight,
  ClipboardList,
  MessageSquare,
  Package,
} from "lucide-react"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { StatCardGrid } from "@/components/dashboard/StatCardGrid"
import type { StatCardProps } from "@/components/dashboard/StatCard"
import { dashboardActivity } from "@/data/dashboard"
import {
  currentUser,
  mockBorrowRequests,
  mockConversations,
  mockNotifications,
} from "@/data/mock-data"
import { useAuthStore } from "@/stores/auth-store"

function DashboardPage() {
  const { user } = useAuthStore()
  const profile = user ?? currentUser
  const unreadAlerts = mockNotifications.filter(
    (notification) => !notification.read,
  ).length
  const pendingRequests = mockBorrowRequests.filter(
    (request) => request.status === "pending",
  ).length
  const unreadMessages = mockConversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0,
  )

  const metrics: StatCardProps[] = [
    {
      label: "Resources Shared",
      value: profile.resourcesShared.toString(),
      icon: Package,
      to: "/my-resources",
    },
    {
      label: "Unread Alerts",
      value: unreadAlerts.toString().padStart(2, "0"),
      icon: AlertTriangle,
      variant: "accent",
      to: "/notifications",
    },
    {
      label: "Pending Requests",
      value: pendingRequests.toString().padStart(2, "0"),
      icon: ClipboardList,
      to: "/borrowing",
    },
    {
      label: "Borrowed Items",
      value: profile.resourcesBorrowed.toString(),
      icon: ArrowLeftRight,
      to: "/borrowing",
    },
    {
      label: "Unread Messages",
      value: unreadMessages.toString().padStart(2, "0"),
      icon: MessageSquare,
      variant: "muted",
      to: "/messages",
    },
  ]

  return (
    <div className="min-h-full bg-[var(--bg-base)]">
      <div className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8 md:px-10 md:py-12 xl:px-0">
        <PageHeader />
        <StatCardGrid metrics={metrics} />
        <ActivityFeed items={dashboardActivity} />
      </div>
    </div>
  )
}

export default DashboardPage
