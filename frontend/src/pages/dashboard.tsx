import { Link } from "react-router-dom"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  ClipboardList,
  Clock3,
  History,
  Menu,
  MessageSquare,
  RotateCcw,
  UserRound,
} from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/stores/auth-store"
import { getInitials } from "@/lib/utils"
import {
  currentUser,
  mockBorrowRequests,
  mockConversations,
  mockNotifications,
} from "@/data/mock-data"

const recentActivity = [
  {
    type: "Borrow Request",
    time: "10 min ago",
    message: "Michael Chen requested your Stage Makeup Kit.",
  },
  {
    type: "Approved",
    time: "1 hr ago",
    message: "Victorian Costume Set approved for pickup.",
  },
  {
    type: "Message",
    time: "2 hrs ago",
    message: "James Martinez sent pickup details.",
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 110, damping: 22 },
  },
}

const blockClass =
  "relative rounded-[var(--dash-radius-lg)] border border-[color:var(--dash-border)] bg-[var(--dash-surface)] shadow-none transition-colors hover:border-[color:var(--dash-border-hover)]"

function DashboardPage() {
  const { setSidebarOpen } = useUIStore()
  const { user } = useAuthStore()
  const shouldReduceMotion = useReducedMotion()
  const profile = user ?? currentUser
  const unreadAlerts = mockNotifications.filter((notification) => !notification.read).length
  const pendingRequests = mockBorrowRequests.filter((request) => request.status === "pending").length
  const unreadMessages = mockConversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0,
  )
  const activeBorrowing = profile.resourcesBorrowed

  const dashboardMetrics = [
    {
      label: "Resources Shared",
      value: profile.resourcesShared.toString(),
      to: "/my-resources",
      className: "lg:col-span-8",
      valueClassName: "text-[clamp(6.5rem,11vw,11rem)]",
    },
    {
      label: "Unread Alerts",
      value: unreadAlerts.toString().padStart(2, "0"),
      to: "/notifications",
      className:
        "border-[color:var(--dash-alert-border)] bg-[var(--dash-alert-bg)] text-[var(--dash-alert-text)] lg:col-span-4",
      valueClassName: "text-[clamp(5.5rem,8.5vw,8.75rem)]",
      icon: AlertTriangle,
    },
    {
      label: "Pending Requests",
      value: pendingRequests.toString().padStart(2, "0"),
      to: "/borrowing",
      className: "lg:col-span-4",
      valueClassName: "text-[clamp(4rem,6.5vw,6.25rem)]",
      icon: ClipboardList,
    },
    {
      label: "Borrowed Items",
      value: activeBorrowing.toString(),
      to: "/borrowing",
      className: "lg:col-span-4",
      valueClassName: "text-[clamp(4rem,6.5vw,6.25rem)]",
    },
    {
      label: "Unread Messages",
      value: unreadMessages.toString().padStart(2, "0"),
      to: "/messages",
      className:
        "bg-[var(--dash-surface-muted)] text-[var(--dash-text)] lg:col-span-4",
      valueClassName: "text-[clamp(4rem,6.5vw,6.25rem)]",
      icon: MessageSquare,
    },
  ]

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[var(--dash-bg)] text-[var(--dash-text)] selection:bg-[var(--dash-accent-muted)] selection:text-[var(--dash-text)]">
      <header className="sticky top-0 z-30 flex h-[6.25rem] items-center justify-between border-b border-[color:var(--dash-border)] bg-[var(--dash-bg-elevated)] px-5 sm:px-8 lg:px-14">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-[var(--dash-radius-sm)] border border-[color:var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text-secondary)] transition-colors hover:bg-[var(--dash-surface-raised)] hover:text-[var(--dash-text)] lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-[clamp(1.35rem,2vw,2rem)] font-semibold uppercase leading-none tracking-[0.04em] text-[var(--dash-text)]">
            Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-5 sm:gap-8">
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="hidden text-[var(--dash-text-muted)] transition-colors hover:text-[var(--dash-text)] sm:block"
          >
            <Bell className="h-5 w-5" strokeWidth={2} />
          </Link>
          <button
            type="button"
            aria-label="Refresh dashboard"
            className="hidden text-[var(--dash-text-muted)] transition-colors hover:text-[var(--dash-text)] md:block"
          >
            <RotateCcw className="h-6 w-6" strokeWidth={2} />
          </button>
          <Link to="/profile" aria-label="Profile">
            <Avatar className="h-11 w-11 rounded-[var(--dash-radius-sm)] border border-[color:var(--dash-border)] bg-[var(--dash-surface-raised)]">
              <AvatarImage src={user?.avatar} alt={user?.name ?? "Profile"} />
              <AvatarFallback className="rounded-[var(--dash-radius-sm)] bg-[var(--dash-surface-raised)] text-sm font-medium text-[var(--dash-text)]">
                {user?.name ? getInitials(user.name) : <UserRound className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      <motion.main
        variants={containerVariants}
        initial={shouldReduceMotion ? false : "hidden"}
        animate="show"
        className="relative px-5 py-10 sm:px-8 lg:px-12 lg:py-14 2xl:px-16"
      >
        <div className="pointer-events-none absolute right-[-6rem] top-2 h-[24rem] w-[24rem] rounded-full border border-[color:var(--dash-border-soft)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="relative max-w-[1480px]">
          <motion.section
            variants={itemVariants}
            className="mb-12 flex flex-col gap-6 border-b border-[color:var(--dash-border)] pb-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <h2 className="text-[clamp(1.4rem,2.2vw,2rem)] font-semibold uppercase tracking-[-0.02em] text-[var(--dash-text)]">
                Overview
              </h2>
              <p className="text-sm font-medium uppercase tracking-[0.1em] text-[var(--dash-text-muted)]">
                / Data sourced live / Resource network
              </p>
            </div>

            <Link
              to="/catalogue"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-[var(--dash-radius-sm)] border border-[color:var(--dash-border)] bg-[var(--dash-surface-raised)] px-6 text-sm font-semibold uppercase tracking-[0.1em] text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-accent-muted)] focus-visible:ring-2 focus-visible:ring-[var(--dash-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--dash-bg)]"
            >
              Browse Catalogue
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.section>

          <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {dashboardMetrics.map((metric) => {
              const Icon = metric.icon

              return (
                <motion.article
                  key={metric.label}
                  variants={itemVariants}
                  className={`${blockClass} ${metric.className} min-h-[17rem] p-6 sm:p-8 xl:min-h-[18.5rem]`}
                >
                  <Link
                    to={metric.to}
                    className="flex h-full flex-col justify-between rounded-[var(--dash-radius-md)] focus-visible:ring-2 focus-visible:ring-[var(--dash-accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--dash-bg)]"
                  >
                    <div className="mb-8 flex items-center justify-between gap-4">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-current opacity-70">
                        {metric.label}
                      </h3>
                      {Icon && <Icon className="h-6 w-6 opacity-75" strokeWidth={1.9} />}
                    </div>
                    <p
                      className={`${metric.valueClassName} font-semibold leading-[0.9] tracking-[-0.05em] text-current`}
                    >
                      {metric.value}
                    </p>
                  </Link>
                </motion.article>
              )
            })}
          </section>

          <motion.section
            variants={itemVariants}
            className="mt-24 border-t border-[color:var(--dash-border)] pt-8"
          >
            <div className="mb-8 flex items-center gap-3">
              <History className="h-5 w-5 text-[var(--dash-text-muted)]" />
              <h2 className="text-[clamp(1.25rem,1.9vw,1.65rem)] font-semibold uppercase tracking-[-0.02em] text-[var(--dash-text)]">
                Recent Activity
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {recentActivity.map((activity) => (
                <motion.article
                  key={`${activity.type}-${activity.time}`}
                  variants={itemVariants}
                  className="rounded-[var(--dash-radius-lg)] border border-[color:var(--dash-border)] bg-[var(--dash-surface)] p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-4 text-sm uppercase tracking-[0.08em] text-[var(--dash-text-muted)]">
                    <span>{activity.type}</span>
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <Clock3 className="h-4 w-4" />
                      {activity.time}
                    </span>
                  </div>
                  <p className="text-base font-medium leading-snug tracking-[-0.01em] text-[var(--dash-text-secondary)]">
                    {activity.message}
                  </p>
                </motion.article>
              ))}
            </div>
          </motion.section>
        </div>
      </motion.main>
    </div>
  )
}

export default DashboardPage
