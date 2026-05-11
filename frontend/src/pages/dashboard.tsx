import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Film,
  MessageSquare,
  Package,
  School,
  Sparkles,
  Theater,
} from "lucide-react"
import { Link } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { dashboardActivity } from "@/data/dashboard"
import {
  currentUser,
  mockBorrowRequests,
  mockConversations,
  mockNotifications,
  mockResources,
  mockUsers,
} from "@/data/mock-data"
import { cn, getInitials } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"

const dashboardCardClass =
  "border-black/10 bg-white/68 shadow-[0_16px_50px_rgba(40,30,20,0.14)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#24201d]/82 dark:shadow-[0_16px_50px_rgba(0,0,0,0.26)]"

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
  const ownedResources = mockResources.filter(
    (resource) => resource.ownerId === profile.id,
  )
  const availableOwnedResources = ownedResources.filter(
    (resource) => resource.status === "available",
  ).length
  const featuredResource =
    ownedResources[1] ?? ownedResources[0] ?? mockResources[4]
  const nextRequest =
    mockBorrowRequests.find((request) => request.status === "pending") ??
    mockBorrowRequests[0]
  const activeBorrow =
    mockBorrowRequests.find((request) => request.status === "approved") ??
    mockBorrowRequests[0]

  return (
    <div className="min-h-full">
      <div className="relative z-10 mx-auto max-w-[1500px] px-6 pb-12 pt-4 sm:px-8 md:px-10 md:pb-14 xl:px-12">
        <div className="mb-14 md:mb-16">
          <h1 className="font-display text-[2.75rem] font-normal leading-none text-[#172033] [text-shadow:_0_2px_20px_rgb(255_255_255_/_22%)] dark:text-[#F0E9DF] dark:[text-shadow:_0_2px_24px_rgb(0_0_0_/_45%)] md:text-6xl">
            Dashboard
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#5f6573] dark:text-[#B8B0A6]">
            Resource flow, pending requests, and production-ready materials across
            your theatre network.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <section className="space-y-6 lg:col-span-4 xl:col-span-3">
            <ResourceNetworkCard
              availableOwnedResources={availableOwnedResources}
              resourcesShared={profile.resourcesShared}
            />
            <RequestCard request={nextRequest} />
            <ActivityJourneyCard activeBorrow={activeBorrow.resource.title} />
          </section>

          <section className="lg:col-span-4 xl:col-span-4">
            <FeaturedResourceCard resource={featuredResource} />
          </section>

          <section className="space-y-6 lg:col-span-4 xl:col-span-5">
            <SignalCard
              pendingRequests={pendingRequests}
              unreadAlerts={unreadAlerts}
              unreadMessages={unreadMessages}
              request={nextRequest}
              dueSoon={activeBorrow.resource.title}
            />
            <NetworkStatsCard
              borrowedItems={profile.resourcesBorrowed}
              resourcesShared={profile.resourcesShared}
              schoolCount={mockUsers.length}
            />
          </section>
        </div>
      </div>
    </div>
  )
}

interface ResourceNetworkCardProps {
  resourcesShared: number
  availableOwnedResources: number
}

function ResourceNetworkCard({
  resourcesShared,
  availableOwnedResources,
}: ResourceNetworkCardProps) {
  return (
    <Card className={cn("overflow-hidden", dashboardCardClass)}>
      <CardHeader className="pb-4">
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Package className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
        </div>
        <CardTitle className="text-lg">Resource Network</CardTitle>
        <CardDescription>
          {availableOwnedResources} available from {resourcesShared} shared items.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Theater, label: "Props", to: "/catalogue" },
          { icon: Film, label: "Shows", to: "/my-resources" },
          { icon: MessageSquare, label: "Chats", to: "/messages" },
        ].map(({ icon: Icon, label, to }) => (
          <Link
            key={label}
            to={to}
            className="group flex aspect-square items-center justify-center rounded-lg border border-border bg-secondary/60 transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={label}
          >
            <Icon
              className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary"
              strokeWidth={1.6}
              aria-hidden="true"
            />
          </Link>
        ))}
        </div>
        <Link
          to="/catalogue"
          className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/30 px-3 py-3 text-sm transition-colors hover:bg-white/45 focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
        >
          <span>
            <span className="block font-medium text-[#172033] dark:text-[#F0E9DF]">
              Browse catalogue
            </span>
            <span className="block text-xs text-muted-foreground">
              {resourcesShared} shared items
            </span>
          </span>
          <ArrowRight className="h-4 w-4 text-primary" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  )
}

interface SignalCardProps {
  pendingRequests: number
  unreadAlerts: number
  unreadMessages: number
  request: (typeof mockBorrowRequests)[number]
  dueSoon: string
}

function SignalCard({
  pendingRequests,
  unreadAlerts,
  unreadMessages,
  request,
  dueSoon,
}: SignalCardProps) {
  return (
    <Card className={cn("overflow-hidden", dashboardCardClass)}>
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Action Queue</CardTitle>
            <CardDescription className="mt-1">
              Requests, alerts, and teacher messages that need a quick look.
            </CardDescription>
          </div>
          <Badge variant="accent" className="gap-1.5 px-3 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Live
          </Badge>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <Badge variant="warning" className="justify-center gap-1.5 px-3 py-1.5">
            <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
            {pendingRequests} pending
          </Badge>
          <Badge variant="accent" className="justify-center gap-1.5 px-3 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            {unreadAlerts} alerts
          </Badge>
          <Badge variant="outline" className="justify-center gap-1.5 px-3 py-1.5">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            {unreadMessages} unread
          </Badge>
        </div>

        <div className="space-y-2">
          <Link
            to="/borrowing"
            className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white/30 px-3 py-3 transition-colors hover:bg-white/45 focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-[#172033] dark:text-[#F0E9DF]">
                {request.resource.title}
              </span>
              <span className="line-clamp-1 text-xs text-muted-foreground">
                {request.borrower.name} requested this for production.
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          </Link>
          <Link
            to="/messages"
            className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white/30 px-3 py-3 transition-colors hover:bg-white/45 focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-[#172033] dark:text-[#F0E9DF]">
                Due soon
              </span>
              <span className="line-clamp-1 text-xs text-muted-foreground">
                {dueSoon} is the next active pickup.
              </span>
            </span>
            <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

interface FeaturedResourceCardProps {
  resource: (typeof mockResources)[number]
}

function FeaturedResourceCard({ resource }: FeaturedResourceCardProps) {
  return (
    <Card className="relative h-full min-h-[36rem] overflow-hidden border-black/10 bg-[var(--bg-raised)] shadow-[0_20px_60px_rgba(0,0,0,0.22)] dark:border-white/10 lg:min-h-[44rem]">
      <img
        src={resource.images[0]}
        alt={resource.title}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      <div className="relative z-10 flex h-full flex-col justify-between p-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <Badge className="border-white/20 bg-white/15 text-white backdrop-blur">
            Featured
          </Badge>
          <span className="rounded-full bg-black/30 px-3 py-1 font-mono text-xs backdrop-blur">
            {resource.rating.toFixed(1)}
          </span>
        </div>
        <div>
          <p className="mb-3 font-label text-[0.65rem] font-medium uppercase tracking-[0.18em] text-white/70">
            Ready To Share
          </p>
          <h2 className="max-w-[16rem] font-display text-3xl leading-tight text-white">
            {resource.title}
          </h2>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/75">
            {resource.description}
          </p>
          <Link
            to={`/resource/${resource.id}`}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white"
          >
            Review item
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Card>
  )
}

interface RequestCardProps {
  request: (typeof mockBorrowRequests)[number]
}

function RequestCard({ request }: RequestCardProps) {
  return (
    <Card className={cn("overflow-hidden", dashboardCardClass)}>
      <div className="flex h-full">
        <img
          src={request.resource.images[0]}
          alt={request.resource.title}
          className="hidden w-32 object-cover sm:block lg:w-28 xl:w-32"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-between p-5">
          <div>
            <CardTitle className="line-clamp-1 text-lg">
              {request.resource.title}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {request.borrower.name} requested this for an upcoming production.
            </CardDescription>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Badge variant="warning" className="capitalize">
              {request.status}
            </Badge>
            <Link
              to="/borrowing"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
            >
              Open
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

interface NetworkStatsCardProps {
  resourcesShared: number
  borrowedItems: number
  schoolCount: number
}

function NetworkStatsCard({
  resourcesShared,
  borrowedItems,
  schoolCount,
}: NetworkStatsCardProps) {
  return (
    <Card className="overflow-hidden border-[#18341e]/15 bg-[#d7ead2]/82 p-5 text-[#18341e] shadow-[0_16px_50px_rgba(24,52,30,0.14)] backdrop-blur-xl dark:border-[#e5f6dd]/12 dark:bg-[#17311f]/82 dark:text-[#e5f6dd] dark:shadow-[0_16px_50px_rgba(0,0,0,0.24)]">
      <div className="mb-6 flex items-center justify-between">
        <CheckCircle2 className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
        <Badge className="border-[#18341e]/15 bg-[#18341e]/10 text-[#18341e] dark:border-[#e5f6dd]/15 dark:bg-[#e5f6dd]/10 dark:text-[#e5f6dd]">
          Live
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Shared", value: resourcesShared },
          { label: "Borrowed", value: borrowedItems },
          { label: "Schools", value: schoolCount },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#18341e]/10 bg-[#18341e]/5 p-3 dark:border-[#e5f6dd]/10 dark:bg-[#e5f6dd]/5"
          >
            <p className="font-mono text-3xl font-light leading-none">
              {stat.value}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] opacity-75">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-5 max-w-xl text-sm leading-6 opacity-80">
        Network health is active across shared resources, borrowing history, and
        partner schools moving through the same resource pool.
      </p>
    </Card>
  )
}

interface ActivityJourneyCardProps {
  activeBorrow: string
}

function ActivityJourneyCard({ activeBorrow }: ActivityJourneyCardProps) {
  return (
    <Card className={cn("relative overflow-hidden p-5", dashboardCardClass)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Weekly Run</CardTitle>
          <CardDescription className="mt-1">
            {activeBorrow} is the next active pickup.
          </CardDescription>
        </div>
        <CalendarDays className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
      </div>

      <div className="mt-5 space-y-3">
        {dashboardActivity.slice(0, 2).map((item) => (
          <div key={item.timeAgo} className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="truncate text-xs text-muted-foreground">{item.timeAgo}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-5 right-5 flex -space-x-2">
        {mockUsers.slice(0, 3).map((networkUser) => (
          <Avatar key={networkUser.id} className="border-2 border-card">
            <AvatarImage src={networkUser.avatar} alt={networkUser.name} />
            <AvatarFallback>{getInitials(networkUser.name)}</AvatarFallback>
          </Avatar>
        ))}
      </div>
    </Card>
  )
}

export default DashboardPage
