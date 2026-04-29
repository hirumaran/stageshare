import type { ComponentType, SVGProps } from "react"
import { Link } from "react-router-dom"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import {
  ArrowLeftRight,
  Bell,
  BookOpen,
  CalendarClock,
  Check,
  ChevronRight,
  ClipboardList,
  Clock,
  FolderOpen,
  LibraryBig,
  LucideIcon,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const ACCENT = "#F5B84C"
const SILVER = "#E8EAED"
const GRAPHITE = "#69717F"

const mockDashboardData = {
  user: { firstName: "Sarah", lastName: "Johnson" },
  stats: [
    {
      id: "shared",
      label: "Resources Shared",
      value: 24,
      trend: "+12%",
      sparkline: [8, 12, 10, 15, 14, 18, 20, 24],
      icon: "FolderOpen",
    },
    {
      id: "borrowed",
      label: "Resources Borrowed",
      value: 12,
      trend: "+8%",
      sparkline: [3, 5, 4, 7, 8, 9, 11, 12],
      icon: "ArrowLeftRight",
    },
    {
      id: "requests",
      label: "Pending Requests",
      value: 1,
      trend: "3 new",
      sparkline: [0, 2, 1, 3, 2, 1, 2, 1],
      icon: "ClipboardList",
    },
    {
      id: "alerts",
      label: "Unread Alerts",
      value: 2,
      trend: "2 urgent",
      sparkline: [0, 0, 1, 0, 2, 1, 0, 2],
      icon: "Bell",
    },
  ],
  velocityData: [
    { day: "Mon", borrowed: 3, shared: 1 },
    { day: "Tue", borrowed: 7, shared: 3 },
    { day: "Wed", borrowed: 5, shared: 4 },
    { day: "Thu", borrowed: 12, shared: 6 },
    { day: "Fri", borrowed: 18, shared: 9 },
    { day: "Sat", borrowed: 14, shared: 8 },
    { day: "Sun", borrowed: 10, shared: 5 },
  ],
  pendingRequests: [
    {
      id: 1,
      requesterName: "Michael Chen",
      schoolName: "Newport HS",
      itemName: "Stage Makeup Kit",
      requestedDate: "2025-05-17",
      returnDate: "2025-05-31",
    },
    {
      id: 2,
      requesterName: "James Martinez",
      schoolName: "Sammamish HS",
      itemName: "Victorian Costume",
      requestedDate: "2025-05-20",
      returnDate: "2025-06-03",
    },
  ],
  recentResources: [
    {
      id: 1,
      name: "Complete Romeo & Juliet Scripts",
      addedBy: "Sarah Johnson",
      category: "Scripts",
      rating: 4.8,
    },
    {
      id: 2,
      name: "Pro Stage Lighting Kit",
      addedBy: "Michael Chen",
      category: "Lighting",
      rating: 4.5,
    },
  ],
  activities: [
    {
      id: 1,
      type: "request",
      description: "Michael Chen wants to borrow your Stage Makeup Kit",
      time: "23m ago",
    },
    {
      id: 2,
      type: "approved",
      description: "James Martinez approved your request",
      time: "6h ago",
    },
    {
      id: 3,
      type: "due_soon",
      description: "Victorian Costume is due in 3 days",
      time: "1d ago",
    },
  ],
}

type IconName = (typeof mockDashboardData.stats)[number]["icon"]
type ActivityType = (typeof mockDashboardData.activities)[number]["type"]

type SparkPoint = {
  index: string
  value: number
}

type DashboardTooltipPayload = {
  dataKey?: string | number
  name?: string | number
  value?: string | number
}

type DashboardTooltipProps = {
  active?: boolean
  label?: string | number
  payload?: DashboardTooltipPayload[]
}

const iconMap: Record<IconName, LucideIcon> = {
  FolderOpen,
  ArrowLeftRight,
  ClipboardList,
  Bell,
}

const activityTone: Record<ActivityType, string> = {
  request: "bg-blue-400",
  approved: "bg-emerald-400",
  due_soon: "bg-amber-400",
}

const categoryIconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  Scripts: BookOpen,
  Lighting: Sparkles,
}

const quickActions = [
  {
    title: "Add Resource",
    description: "List a new asset",
    to: "/my-resources",
    icon: Plus,
  },
  {
    title: "Search Catalogue",
    description: "Find costumes & gear",
    to: "/catalogue",
    icon: Search,
  },
  {
    title: "Borrowing",
    description: "Review active loans",
    to: "/borrowing",
    icon: CalendarClock,
  },
  {
    title: "Messages",
    description: "Coordinate handoffs",
    to: "/messages",
    icon: MessageSquare,
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
}

const hoverSpring = {
  scale: 0.98,
  transition: { type: "spring", stiffness: 100, damping: 20 },
} as const

const panelClass =
  "relative overflow-hidden rounded-[2rem] bg-[#0F1117] text-[#E8EAED] backdrop-blur-xl transition-colors duration-300 hover:bg-[#141920] focus-within:bg-[#141920]"

const labelClass =
  "text-[clamp(0.68rem,0.7vw,0.78rem)] font-semibold uppercase tracking-widest text-white/[0.36]"

const titleClass =
  "text-[clamp(1.1rem,1.35vw,1.45rem)] font-semibold tracking-tighter text-white"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
})

const requestDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
})

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function formatRange(startDate: string, endDate: string) {
  const start = requestDateFormatter.format(new Date(startDate))
  const end = requestDateFormatter.format(new Date(endDate))
  return `${start} - ${end}`
}

function sparklineData(values: number[]): SparkPoint[] {
  return values.map((value, index) => ({
    index: `${index + 1}`,
    value,
  }))
}

function ChartTooltip({
  active,
  label,
  payload,
}: DashboardTooltipProps) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white shadow-2xl shadow-black/50 ring-1 ring-white/10 backdrop-blur-xl">
      <p className="mb-2 text-[clamp(0.68rem,0.7vw,0.75rem)] font-semibold uppercase tracking-widest text-white/[0.45]">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex min-w-36 items-center justify-between gap-5"
          >
            <span className="text-white/50">{entry.name}</span>
            <span className="font-semibold tabular-nums text-white">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardPage() {
  const shouldReduceMotion = useReducedMotion()
  const hover = shouldReduceMotion ? undefined : hoverSpring
  const currentDate = dateFormatter.format(new Date()).toUpperCase()

  return (
    <div className="-m-4 min-h-dvh overflow-x-hidden bg-[#080A0A] text-[#E8EAED] selection:bg-[#F5B84C]/30 lg:-m-6">
      <motion.main
        variants={containerVariants}
        initial={shouldReduceMotion ? false : "hidden"}
        animate="show"
        className="grid grid-cols-12 gap-4 p-8"
      >
        <motion.section
          variants={itemVariants}
          className={`${panelClass} col-span-12 p-10`}
        >
          <div className="pointer-events-none absolute right-8 top-8 h-44 w-44 rounded-full bg-white/5 blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl space-y-5">
              <p className={labelClass}>{currentDate}</p>
              <h1 className="text-balance font-display text-[clamp(2rem,3vw,2.75rem)] font-semibold leading-[0.98] tracking-tighter text-white">
                Welcome back,{" "}
                <span className="text-[#F5B84C]">
                  {mockDashboardData.user.firstName}
                </span>
              </h1>
              <p className="max-w-2xl text-[clamp(1rem,1.1vw,1.12rem)] leading-relaxed text-white/[0.45]">
                Your theatre resource network is quiet, liquid, and ready for
                the next handoff.
              </p>
            </div>

            <motion.div whileHover={hover} whileTap={{ scale: 0.96 }}>
              <Link
                to="/catalogue"
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#F5B84C] px-7 py-4 text-[clamp(0.82rem,0.9vw,0.95rem)] font-semibold text-[#080A0A] shadow-[0_0_48px_rgba(245,184,76,0.26)] transition-colors duration-200 hover:bg-[#ffd479] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B84C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080A0A]"
              >
                Browse Catalogue
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {mockDashboardData.stats.map((stat) => {
          const Icon = iconMap[stat.icon]
          const isAlert = stat.id === "alerts"

          return (
            <motion.article
              key={stat.id}
              variants={itemVariants}
              whileHover={hover}
              className={`${panelClass} group col-span-12 min-h-64 p-8 sm:col-span-6 lg:col-span-3`}
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(245,184,76,0.24),transparent_62%)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                <div className="flex items-start justify-between gap-5">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 backdrop-blur-xl">
                    <Icon
                      aria-hidden="true"
                      className={isAlert ? "h-5 w-5 text-[#F5B84C]" : "h-5 w-5 text-white/[0.55]"}
                      strokeWidth={1.5}
                    />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[clamp(0.68rem,0.7vw,0.76rem)] font-semibold uppercase tracking-widest ${
                      isAlert
                        ? "bg-[#F5B84C]/15 text-[#F5B84C]"
                        : "bg-white/5 text-white/[0.42]"
                    }`}
                  >
                    {stat.trend}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="font-display text-[clamp(2rem,3vw,3.25rem)] font-semibold leading-none tracking-tighter text-white tabular-nums">
                    {stat.value}
                  </p>
                  <h2 className={labelClass}>{stat.label}</h2>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 h-24 opacity-55">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={sparklineData(stat.sparkline)}
                    margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id={`spark-${stat.id}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={isAlert ? ACCENT : SILVER}
                          stopOpacity={isAlert ? 0.3 : 0.14}
                        />
                        <stop
                          offset="100%"
                          stopColor={isAlert ? ACCENT : SILVER}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={isAlert ? ACCENT : "rgba(232,234,237,0.34)"}
                      strokeWidth={1.8}
                      fill={`url(#spark-${stat.id})`}
                      dot={false}
                      isAnimationActive={!shouldReduceMotion}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.article>
          )
        })}

        <motion.section
          variants={itemVariants}
          whileHover={hover}
          className={`${panelClass} col-span-12 min-h-[34rem] p-10 lg:col-span-7`}
        >
          <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <p className={labelClass}>Circulation</p>
              <h2 className={titleClass}>Borrowing Velocity</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[clamp(0.72rem,0.75vw,0.8rem)] text-white/[0.55] backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-[#E8EAED]" />
                Borrowed
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[clamp(0.72rem,0.75vw,0.8rem)] text-white/[0.55] backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-[#69717F]" />
                Shared
              </span>
            </div>
          </div>

          <div className="h-[25rem]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={mockDashboardData.velocityData}
                margin={{ top: 18, right: 8, bottom: 10, left: 0 }}
              >
                <defs>
                  <linearGradient id="borrowed-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SILVER} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={SILVER} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="shared-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GRAPHITE} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={GRAPHITE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={18}
                  tick={{ fill: "rgba(232,234,237,0.32)", fontSize: 12 }}
                />
                <Tooltip
                  cursor={false}
                  content={(props) => <ChartTooltip {...props} />}
                  isAnimationActive={!shouldReduceMotion}
                />
                <Area
                  name="Borrowed"
                  type="monotone"
                  dataKey="borrowed"
                  stroke={SILVER}
                  strokeWidth={2.4}
                  fill="url(#borrowed-fill)"
                  dot={false}
                  activeDot={{ r: 4, fill: SILVER, strokeWidth: 0 }}
                  isAnimationActive={!shouldReduceMotion}
                />
                <Area
                  name="Shared"
                  type="monotone"
                  dataKey="shared"
                  stroke={GRAPHITE}
                  strokeWidth={2.4}
                  fill="url(#shared-fill)"
                  dot={false}
                  activeDot={{ r: 4, fill: GRAPHITE, strokeWidth: 0 }}
                  isAnimationActive={!shouldReduceMotion}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section
          variants={itemVariants}
          className={`${panelClass} col-span-12 p-8 lg:col-span-5`}
        >
          <div className="mb-8 flex items-start justify-between gap-5">
            <div className="space-y-3">
              <p className={labelClass}>Queue</p>
              <h2 className={titleClass}>Pending Requests</h2>
            </div>
            <div className="rounded-full bg-[#F5B84C]/15 px-3 py-1 text-[clamp(0.68rem,0.7vw,0.76rem)] font-semibold uppercase tracking-widest text-[#F5B84C]">
              Active
            </div>
          </div>

          <div className="space-y-4">
            {mockDashboardData.pendingRequests.map((request) => (
              <motion.article
                key={request.id}
                variants={itemVariants}
                whileHover={hover}
                className="group rounded-[1.5rem] bg-white/5 p-5 backdrop-blur-xl transition-colors duration-300 hover:bg-white/[0.07] focus-within:bg-white/[0.07]"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-full ring-2 ring-emerald-400/70 ring-offset-4 ring-offset-[#11151B]">
                    <Avatar className="h-12 w-12 bg-[#141920]">
                      <AvatarFallback className="bg-white/5 text-[clamp(0.78rem,0.8vw,0.86rem)] font-semibold text-white/[0.72]">
                        {getInitials(request.requesterName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[clamp(0.96rem,1vw,1.05rem)] font-semibold tracking-tight text-white">
                        {request.requesterName}
                      </h3>
                      <p className="truncate text-[clamp(0.78rem,0.82vw,0.88rem)] text-white/[0.42]">
                        {request.schoolName} / {request.itemName}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[clamp(0.72rem,0.75vw,0.8rem)] text-white/[0.38]">
                      <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                      <span>{formatRange(request.requestedDate, request.returnDate)}</span>
                    </div>
                  </div>

                  <div className="flex translate-y-1 gap-2 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <motion.button
                      type="button"
                      whileHover={hover}
                      whileTap={{ scale: 0.94 }}
                      aria-label={`Approve ${request.requesterName}'s request`}
                      className="grid h-11 w-11 place-items-center rounded-full bg-emerald-400/[0.12] text-emerald-300 transition-colors duration-200 hover:bg-emerald-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11151B]"
                    >
                      <Check aria-hidden="true" className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={hover}
                      whileTap={{ scale: 0.94 }}
                      aria-label={`Decline ${request.requesterName}'s request`}
                      className="grid h-11 w-11 place-items-center rounded-full bg-red-400/10 text-red-300 transition-colors duration-200 hover:bg-red-400/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11151B]"
                    >
                      <X aria-hidden="true" className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section
          variants={itemVariants}
          className={`${panelClass} col-span-12 p-8 lg:col-span-5`}
        >
          <div className="mb-8 flex items-start justify-between gap-5">
            <div className="space-y-3">
              <p className={labelClass}>Catalogue</p>
              <h2 className={titleClass}>Recent Resources</h2>
            </div>
            <LibraryBig aria-hidden="true" className="h-5 w-5 text-white/30" />
          </div>

          <div className="space-y-4">
            {mockDashboardData.recentResources.map((resource) => {
              const ResourceIcon = categoryIconMap[resource.category] ?? FolderOpen

              return (
                <motion.div
                  key={resource.id}
                  variants={itemVariants}
                  whileHover={hover}
                >
                  <Link
                    to={`/resource/${resource.id}`}
                    className="group flex min-h-28 items-center gap-5 rounded-[1.5rem] bg-white/5 p-4 backdrop-blur-xl transition-colors duration-300 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/[0.35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1117]"
                  >
                    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[1.25rem] bg-white/5">
                      <ResourceIcon
                        aria-hidden="true"
                        className="h-7 w-7 text-white/[0.35]"
                        strokeWidth={1.5}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[clamp(0.96rem,1vw,1.06rem)] font-semibold tracking-tight text-white">
                        {resource.name}
                      </h3>
                      <p className="mt-1 truncate text-[clamp(0.78rem,0.82vw,0.88rem)] text-white/40">
                        Added by {resource.addedBy}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/5 px-3 py-1 text-[clamp(0.68rem,0.7vw,0.76rem)] font-semibold uppercase tracking-widest text-white/[0.45]">
                          {resource.category}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[clamp(0.68rem,0.7vw,0.76rem)] text-white/[0.45]">
                          <Star
                            aria-hidden="true"
                            className="h-3.5 w-3.5 fill-white/[0.35] text-white/[0.35]"
                          />
                          {resource.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <ChevronRight
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 translate-x-1 text-white/0 transition-[color,transform] duration-200 group-hover:translate-x-0 group-hover:text-white/[0.42] group-focus-visible:translate-x-0 group-focus-visible:text-white/[0.42]"
                    />
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        <motion.section
          variants={itemVariants}
          className={`${panelClass} col-span-12 p-8 lg:col-span-3`}
        >
          <div className="mb-8 space-y-3">
            <p className={labelClass}>Signal</p>
            <h2 className={titleClass}>Activity Feed</h2>
          </div>

          <div className="relative space-y-8">
            <div className="absolute left-[0.3125rem] top-2 h-[calc(100%-1rem)] w-px bg-white/10" />
            {mockDashboardData.activities.map((activity, index) => (
              <motion.article
                key={activity.id}
                variants={itemVariants}
                className={`relative pl-8 ${index > 1 ? "opacity-50" : "opacity-100"}`}
              >
                <span
                  className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${activityTone[activity.type]}`}
                />
                <h3 className="text-[clamp(0.9rem,0.95vw,1rem)] font-medium leading-snug text-white/80">
                  {activity.description}
                </h3>
                <p className="mt-2 text-[clamp(0.72rem,0.75vw,0.8rem)] text-white/[0.34]">
                  {activity.time}
                </p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section
          variants={itemVariants}
          className={`${panelClass} col-span-12 p-8 lg:col-span-4`}
        >
          <div className="mb-8 flex items-start justify-between gap-5">
            <div className="space-y-3">
              <p className={labelClass}>Command</p>
              <h2 className={titleClass}>Quick Actions</h2>
            </div>
            <ShieldCheck aria-hidden="true" className="h-5 w-5 text-white/30" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon

              return (
                <motion.div
                  key={action.title}
                  variants={itemVariants}
                  whileHover={hover}
                  whileTap={{ scale: 0.96 }}
                >
                  <Link
                    to={action.to}
                    className="group flex min-h-44 flex-col justify-between rounded-[1.5rem] bg-white/5 p-6 backdrop-blur-xl transition-colors duration-300 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/[0.35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1117]"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5">
                      <Icon
                        aria-hidden="true"
                        className="h-5 w-5 text-white/[0.48] transition-colors duration-200 group-hover:text-white/[0.72]"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-[clamp(0.96rem,1vw,1.08rem)] font-semibold tracking-tight text-white">
                        {action.title}
                      </h3>
                      <p className="text-[clamp(0.76rem,0.8vw,0.86rem)] leading-relaxed text-white/[0.38]">
                        {action.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </motion.section>
      </motion.main>
    </div>
  )
}

export default DashboardPage
