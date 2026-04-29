import { useEffect } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowUpRight,
  FolderOpen,
  ArrowLeftRight,
  BookOpen,
  TrendingUp,
  Bell,
  Star,
  Zap,
  Clock,
  CheckCircle2,
  Camera,
  Mic,
  Monitor,
  Video,
  ChevronRight,
} from "lucide-react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from "recharts"
import { useAuthStore } from "@/stores/auth-store"
import { useCatalogueStore } from "@/stores/catalogue-store"
import { useUIStore } from "@/stores/ui-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate, getInitials, truncate, formatRelativeTime } from "@/lib/utils"

// ------------------------------------------------------------------
// Animation Variants
// ------------------------------------------------------------------
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
}

const cardHover = {
  scale: 1.01,
  transition: { type: "spring" as const, stiffness: 300, damping: 25 },
}

// ------------------------------------------------------------------
// Hyper-Realistic Mock Data
// ------------------------------------------------------------------
const DEMO_RESOURCES = [
  {
    id: "r1",
    title: "Canon EOS R5 Cinema Kit with RF 24-70mm f/2.8L",
    category: "photography",
    rating: 4.9,
    owner: { name: "Maya Chen" },
    images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop"],
  },
  {
    id: "r2",
    title: "RODE NT1-A Anniversary Edition Microphone",
    category: "audio",
    rating: 4.7,
    owner: { name: "Jordan Blake" },
    images: ["https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=400&fit=crop"],
  },
  {
    id: "r3",
    title: "Wacom Cintiq Pro 24 Creative Pen Display",
    category: "design",
    rating: 4.8,
    owner: { name: "Alex Rivera" },
    images: ["https://images.unsplash.com/photo-1585792180666-f7347f490e08?w=400&h=400&fit=crop"],
  },
  {
    id: "r4",
    title: "DJI RS 3 Pro Handheld Gimbal Stabilizer",
    category: "videography",
    rating: 4.6,
    owner: { name: "Sam Park" },
    images: ["https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=400&h=400&fit=crop"],
  },
]

const DEMO_REQUESTS = [
  {
    id: "br1",
    borrower: { name: "Taylor Nguyen", avatar: "" },
    resource: { title: "Canon EOS R5 Cinema Kit with RF 24-70mm f/2.8L" },
    requestedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: "pending",
  },
  {
    id: "br2",
    borrower: { name: "Casey O'Brien", avatar: "" },
    resource: { title: "Wacom Cintiq Pro 24 Creative Pen Display" },
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    status: "pending",
  },
  {
    id: "br3",
    borrower: { name: "Riley Santos", avatar: "" },
    resource: { title: "RODE NT1-A Anniversary Edition Microphone" },
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    status: "pending",
  },
]

const DEMO_NOTIFICATIONS = [
  {
    id: "n1",
    title: "Request Approved",
    message: "Your request for Sony A7S III was approved by Alex Rivera",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
    type: "request_approved" as const,
  },
  {
    id: "n2",
    title: "Item Returned",
    message: "Maya Chen returned the DJI Mavic 3 Pro drone",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
    type: "item_returned" as const,
  },
  {
    id: "n3",
    title: "New Resource",
    message: "Aputure 600x LED Kit was added to the catalogue",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: true,
    type: "review_received" as const,
  },
  {
    id: "n4",
    title: "Return Reminder",
    message: "Return Blackmagic Pocket 6K by tomorrow to avoid late fees",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    read: true,
    type: "reminder" as const,
  },
]

const CHART_DATA = [
  { day: "Mon", borrowed: 12, shared: 8 },
  { day: "Tue", borrowed: 18, shared: 11 },
  { day: "Wed", borrowed: 15, shared: 14 },
  { day: "Thu", borrowed: 22, shared: 9 },
  { day: "Fri", borrowed: 28, shared: 16 },
  { day: "Sat", borrowed: 20, shared: 12 },
  { day: "Sun", borrowed: 14, shared: 7 },
]

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const categoryIcon = (cat: string) => {
  switch (cat) {
    case "photography":
      return Camera
    case "audio":
      return Mic
    case "design":
      return Monitor
    case "videography":
      return Video
    default:
      return Zap
  }
}

const categoryLabel = (cat: string) =>
  cat.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())

const glassCard =
  "relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl transition-colors hover:border-white/[0.12]"

const sectionTitle =
  "text-[clamp(0.875rem,1.4vw,1.125rem)] font-medium tracking-tight text-white/90"

const metricValue =
  "text-[clamp(1.75rem,2.8vw,2.75rem)] font-bold tracking-tighter text-white"

const metricLabel =
  "text-[clamp(0.65rem,0.9vw,0.75rem)] font-medium uppercase tracking-[0.15em] text-white/40"

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function DashboardPage() {
  const { user } = useAuthStore()
  const { resources, fetchResources } = useCatalogueStore()
  const { notifications, borrowRequests, fetchNotifications, fetchBorrowRequests } = useUIStore()

  useEffect(() => {
    fetchResources()
    fetchNotifications()
    fetchBorrowRequests()
  }, [fetchResources, fetchNotifications, fetchBorrowRequests])

  const firstName = user?.name?.split(" ")[0] ?? "Creator"

  const recentResources = resources.length > 0 ? resources.slice(0, 4) : DEMO_RESOURCES
  const pendingRequests = borrowRequests.filter((r) => r.status === "pending")
  const displayRequests = pendingRequests.length > 0 ? pendingRequests : DEMO_REQUESTS
  const unreadNotifications = notifications.filter((n) => !n.read)
  const displayNotifications = notifications.length > 0 ? notifications : DEMO_NOTIFICATIONS

  const stats = [
    {
      label: "Resources Shared",
      value: user?.resourcesShared || 24,
      icon: FolderOpen,
      accent: "text-amber-400",
      bg: "bg-amber-400/10",
      trend: "+12%",
    },
    {
      label: "Resources Borrowed",
      value: user?.resourcesBorrowed || 18,
      icon: ArrowLeftRight,
      accent: "text-emerald-400",
      bg: "bg-emerald-400/10",
      trend: "+8%",
    },
    {
      label: "Pending Requests",
      value: pendingRequests.length || displayRequests.length,
      icon: BookOpen,
      accent: "text-violet-400",
      bg: "bg-violet-400/10",
      trend: "3 new",
    },
    {
      label: "Unread Alerts",
      value: unreadNotifications.length || 2,
      icon: Bell,
      accent: "text-rose-400",
      bg: "bg-rose-400/10",
      trend: "2 urgent",
    },
  ]

  return (
    <div className="-m-4 lg:-m-6 min-h-full bg-[#000000] text-[#F8FAFC] selection:bg-white/20">
      <motion.div
        className="p-6 lg:p-10 space-y-8 lg:space-y-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* ── Hero ── */}
        <motion.section
          variants={itemVariants}
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div className="space-y-2">
            <p className="text-[clamp(0.75rem,1vw,0.875rem)] font-medium uppercase tracking-[0.2em] text-white/40">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h1 className="text-[clamp(1.75rem,4vw,3.25rem)] font-semibold tracking-tighter leading-[1.1]">
              Welcome back,{" "}
              <span className="text-white/50">{firstName}</span>
            </h1>
            <p className="text-[clamp(0.875rem,1.2vw,1rem)] leading-relaxed text-white/40 max-w-md">
              Here is what is happening across your creative toolkit today.
            </p>
          </div>

          <motion.div whileHover={{ scale: 0.97 }} whileTap={{ scale: 0.95 }}>
            <Button
              asChild
              className="rounded-full bg-white text-black hover:bg-white/90 px-6 py-5 text-sm font-semibold tracking-tight transition-colors"
            >
              <Link to="/catalogue">
                Browse Catalogue
                <ArrowUpRight className="ml-2 h-4 w-4" strokeWidth={1.5} />
              </Link>
            </Button>
          </motion.div>
        </motion.section>

        {/* ── Stats Bento ── */}
        <motion.section
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5"
        >
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                className={`${glassCard} p-6 lg:p-7 lg:col-span-3`}
                whileHover={cardHover}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`rounded-2xl p-3 ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.accent}`} strokeWidth={1.5} />
                  </div>
                  <span className="text-[clamp(0.65rem,0.85vw,0.75rem)] font-medium text-white/30">
                    {stat.trend}
                  </span>
                </div>
                <p className={metricValue}>{stat.value}</p>
                <p className={`${metricLabel} mt-1`}>{stat.label}</p>
              </motion.div>
            )
          })}
        </motion.section>

        {/* ── Main Bento ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* Recent Resources (large) */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className={`${glassCard} lg:col-span-8 p-6 lg:p-8`}
            whileHover={cardHover}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={sectionTitle}>Recent Resources</h2>
                <p className="text-[clamp(0.75rem,1vw,0.875rem)] text-white/30 mt-1">
                  Latest additions to the shared catalogue
                </p>
              </div>
              <motion.div whileHover={{ scale: 0.95 }} whileTap={{ scale: 0.92 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-white/40 hover:text-white hover:bg-white/5 rounded-full px-4"
                >
                  <Link to="/catalogue">
                    View all
                    <ChevronRight className="ml-1 h-4 w-4" strokeWidth={1.5} />
                  </Link>
                </Button>
              </motion.div>
            </div>

            <div className="space-y-3">
              {recentResources.map((resource) => {
                const CatIcon = categoryIcon(resource.category)
                return (
                  <motion.div
                    key={resource.id}
                    whileHover={{ scale: 1.005 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <Link
                      to={`/resource/${resource.id}`}
                      className="group flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="relative h-[4.5rem] w-[4.5rem] rounded-xl overflow-hidden flex-shrink-0 bg-white/[0.04] border border-white/[0.06]">
                        {resource.images[0] ? (
                          <img
                            src={resource.images[0]}
                            alt={resource.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <CatIcon
                              className="h-6 w-6 text-white/20"
                              strokeWidth={1.5}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[clamp(0.8rem,1.1vw,0.95rem)] font-medium leading-snug text-white/90 truncate">
                          {truncate(resource.title, 48)}
                        </h4>
                        <p className="text-[clamp(0.7rem,0.95vw,0.8rem)] text-white/30 mt-0.5">
                          {resource.owner.name}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="secondary"
                            className="rounded-full px-2.5 py-0.5 text-[clamp(0.6rem,0.85vw,0.7rem)] font-medium bg-white/[0.06] text-white/50 hover:bg-white/[0.1] border-0"
                          >
                            {categoryLabel(resource.category)}
                          </Badge>
                          <div className="flex items-center text-[clamp(0.65rem,0.85vw,0.75rem)] text-white/30">
                            <Star
                              className="h-3 w-3 mr-1 fill-amber-400 text-amber-400"
                              strokeWidth={1.5}
                            />
                            {(resource.rating || 4.5).toFixed(1)}
                          </div>
                        </div>
                      </div>

                      <ArrowUpRight
                        className="h-5 w-5 text-white/10 group-hover:text-white/40 transition-colors flex-shrink-0"
                        strokeWidth={1.5}
                      />
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Right stack: Pending Requests + Activity */}
          <div className="lg:col-span-4 flex flex-col gap-4 lg:gap-5">
            {/* Pending Requests */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              className={`${glassCard} p-6 lg:p-7 flex-1`}
              whileHover={cardHover}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className={sectionTitle}>Pending Requests</h2>
                <motion.div whileHover={{ scale: 0.95 }} whileTap={{ scale: 0.92 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-white/40 hover:text-white hover:bg-white/5 rounded-full px-4"
                  >
                    <Link to="/borrowing">
                      Review
                      <ChevronRight className="ml-1 h-4 w-4" strokeWidth={1.5} />
                    </Link>
                  </Button>
                </motion.div>
              </div>

              <div className="space-y-3">
                {displayRequests.slice(0, 3).map((request) => (
                  <motion.div
                    key={request.id}
                    className="flex items-start gap-3 rounded-2xl p-3 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <Avatar className="h-9 w-9 border border-white/[0.08]">
                      <AvatarImage src={request.borrower.avatar} />
                      <AvatarFallback className="bg-white/[0.06] text-white/60 text-xs font-medium">
                        {getInitials(request.borrower.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[clamp(0.8rem,1.05vw,0.9rem)] font-medium text-white/80 truncate">
                        {request.borrower.name}
                      </p>
                      <p className="text-[clamp(0.65rem,0.9vw,0.75rem)] text-white/30 truncate">
                        wants to borrow{" "}
                        <span className="text-white/50">
                          {truncate(request.resource.title, 24)}
                        </span>
                      </p>
                      <p className="text-[clamp(0.6rem,0.8vw,0.7rem)] text-white/20 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" strokeWidth={1.5} />
                        {formatRelativeTime(request.requestedAt)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              className={`${glassCard} p-6 lg:p-7`}
              whileHover={cardHover}
            >
              <h2 className={`${sectionTitle} mb-5`}>Activity</h2>
              <div className="space-y-4">
                {displayNotifications.slice(0, 4).map((n) => (
                  <div key={n.id} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                        n.type === "request_approved"
                          ? "bg-emerald-400"
                          : n.type === "reminder"
                          ? "bg-amber-400"
                          : "bg-white/20"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[clamp(0.75rem,1vw,0.85rem)] text-white/60 leading-snug">
                        {n.message}
                      </p>
                      <p className="text-[clamp(0.6rem,0.8vw,0.7rem)] text-white/20 mt-1">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Bottom Bento ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* Analytics Chart */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className={`${glassCard} lg:col-span-8 p-6 lg:p-8`}
            whileHover={cardHover}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={sectionTitle}>Borrowing Velocity</h2>
                <p className="text-[clamp(0.75rem,1vw,0.875rem)] text-white/30 mt-1">
                  Weekly resource circulation across the network
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-[clamp(0.65rem,0.85vw,0.75rem)] text-white/30">
                    Borrowed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="text-[clamp(0.65rem,0.85vw,0.75rem)] text-white/30">
                    Shared
                  </span>
                </div>
              </div>
            </div>

            <div className="h-[220px] lg:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="borrowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#FBBF24" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="shareGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,10,10,0.9)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      backdropFilter: "blur(12px)",
                      color: "#F8FAFC",
                      fontSize: 12,
                    }}
                    itemStyle={{ color: "#F8FAFC" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="borrowed"
                    stroke="#FBBF24"
                    strokeWidth={2}
                    fill="url(#borrowGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="shared"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={2}
                    fill="url(#shareGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className={`${glassCard} lg:col-span-4 p-6 lg:p-8`}
            whileHover={cardHover}
          >
            <h2 className={`${sectionTitle} mb-6`}>Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  to: "/my-resources",
                  icon: FolderOpen,
                  label: "Add Resource",
                },
                {
                  to: "/catalogue",
                  icon: BookOpen,
                  label: "Browse",
                },
                {
                  to: "/borrowing",
                  icon: ArrowLeftRight,
                  label: "Borrowing",
                },
                {
                  to: "/messages",
                  icon: Zap,
                  label: "Messages",
                },
              ].map((action) => {
                const Icon = action.icon
                return (
                  <motion.div
                    key={action.label}
                    whileHover={{ scale: 0.97 }}
                    whileTap={{ scale: 0.94 }}
                  >
                    <Link
                      to={action.to}
                      className="flex flex-col items-center justify-center gap-3 rounded-2xl p-5 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-colors group"
                    >
                      <Icon
                        className="h-6 w-6 text-white/30 group-hover:text-white/60 transition-colors"
                        strokeWidth={1.5}
                      />
                      <span className="text-[clamp(0.7rem,0.95vw,0.8rem)] font-medium text-white/50 group-hover:text-white/80 transition-colors">
                        {action.label}
                      </span>
                    </Link>
                  </motion.div>
                )
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-500/10 p-2">
                  <CheckCircle2
                    className="h-4 w-4 text-emerald-400"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p className="text-[clamp(0.75rem,1vw,0.875rem)] font-medium text-white/70">
                    System Status
                  </p>
                  <p className="text-[clamp(0.65rem,0.85vw,0.75rem)] text-white/30">
                    All services operational
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </motion.div>
    </div>
  )
}
