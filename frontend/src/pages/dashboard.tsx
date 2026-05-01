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
  "relative border-[3px] border-black bg-[#f7f7f5] shadow-[7px_7px_0_#000]"

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
      valueClassName: "text-[clamp(7.5rem,13vw,13rem)]",
    },
    {
      label: "Unread Alerts",
      value: unreadAlerts.toString().padStart(2, "0"),
      to: "/notifications",
      className: "bg-[#ffc425] lg:col-span-4",
      valueClassName: "text-[clamp(6rem,10vw,10rem)]",
      icon: AlertTriangle,
    },
    {
      label: "Pending Requests",
      value: pendingRequests.toString().padStart(2, "0"),
      to: "/borrowing",
      className: "lg:col-span-4",
      valueClassName: "text-[clamp(4.5rem,7vw,7rem)]",
      icon: ClipboardList,
    },
    {
      label: "Borrowed Items",
      value: activeBorrowing.toString(),
      to: "/borrowing",
      className: "lg:col-span-4",
      valueClassName: "text-[clamp(4.5rem,7vw,7rem)]",
    },
    {
      label: "Unread Messages",
      value: unreadMessages.toString().padStart(2, "0"),
      to: "/messages",
      className: "bg-black text-white lg:col-span-4",
      valueClassName: "text-[clamp(4.5rem,7vw,7rem)]",
      icon: MessageSquare,
    },
  ]

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#f6f5f1] text-black selection:bg-black selection:text-white">
      <header className="sticky top-0 z-30 flex h-[6.25rem] items-center justify-between border-b-[5px] border-black bg-[#fbfaf7] px-5 sm:px-8 lg:px-14">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="grid h-11 w-11 place-items-center border-2 border-black bg-white text-black transition-colors hover:bg-black hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-[clamp(1.35rem,2vw,2rem)] font-black uppercase leading-none tracking-[0.08em] text-black">
            Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-5 sm:gap-8">
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="hidden text-black transition-transform hover:-translate-y-0.5 sm:block"
          >
            <Bell className="h-6 w-6" strokeWidth={2.3} />
          </Link>
          <button
            type="button"
            aria-label="Refresh dashboard"
            className="hidden text-black transition-transform hover:-rotate-12 md:block"
          >
            <RotateCcw className="h-7 w-7" strokeWidth={2.3} />
          </button>
          <Link to="/profile" aria-label="Profile">
            <Avatar className="h-12 w-12 rounded-none border-2 border-black bg-[#d8d8d4]">
              <AvatarImage src={user?.avatar} alt={user?.name ?? "Profile"} />
              <AvatarFallback className="rounded-none bg-[#d8d8d4] text-sm font-black text-black">
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
        <div className="pointer-events-none absolute right-[-6rem] top-2 h-[24rem] w-[24rem] rounded-full border-2 border-black/10" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(#000_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="relative max-w-[1480px]">
          <motion.section
            variants={itemVariants}
            className="mb-14 flex flex-col gap-7 border-b-[5px] border-black pb-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <h2 className="text-[clamp(1.4rem,2.2vw,2rem)] font-black uppercase tracking-[-0.04em] text-black">
                Overview
              </h2>
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-black/80">
                / Data sourced live / Resource network
              </p>
            </div>

            <Link
              to="/catalogue"
              className="inline-flex min-h-16 items-center justify-center gap-3 bg-black px-8 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[6px_6px_0_#000] transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f5f1]"
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
                  className={`${blockClass} ${metric.className} min-h-[17rem] p-8 sm:p-10 xl:min-h-[18.5rem]`}
                >
                  <Link
                    to={metric.to}
                    className="flex h-full flex-col justify-between focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-[#f6f5f1]"
                  >
                    <div className="mb-8 flex items-center justify-between gap-4">
                      <h3 className="text-sm font-black uppercase tracking-[0.18em] text-current opacity-80">
                        {metric.label}
                      </h3>
                      {Icon && <Icon className="h-7 w-7" strokeWidth={2.2} />}
                    </div>
                    <p
                      className={`${metric.valueClassName} font-black leading-[0.82] tracking-[-0.08em] text-current`}
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
            className="mt-24 border-t-[5px] border-black pt-9"
          >
            <div className="mb-8 flex items-center gap-3">
              <History className="h-6 w-6" />
              <h2 className="text-[clamp(1.25rem,1.9vw,1.65rem)] font-black uppercase tracking-[-0.06em] text-black">
                Recent Activity
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {recentActivity.map((activity) => (
                <motion.article
                  key={`${activity.type}-${activity.time}`}
                  variants={itemVariants}
                  className="border-2 border-black bg-[#f7f7f5] p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-4 text-lg uppercase tracking-[-0.05em] text-black/80">
                    <span>{activity.type}</span>
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <Clock3 className="h-4 w-4" />
                      {activity.time}
                    </span>
                  </div>
                  <p className="text-lg font-black leading-snug tracking-[-0.04em] text-black">
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
