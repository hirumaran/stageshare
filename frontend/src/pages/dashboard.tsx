import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Film,
  MessageSquare,
  Package,
  Sparkles,
  Theater,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BentoGridShowcase } from "@/components/ui/bento-grid"
import CataloguePortal from "@/components/ui/CataloguePortal"
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
import { getInitials } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"

function DashboardPage() {
  const navigate = useNavigate()
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
    <div className="min-h-full bg-[var(--bg-base)]">
      <div className="mx-auto max-w-[1120px] px-5 pb-10 pt-6 sm:px-8 md:px-10 md:pb-12 md:pt-8 xl:px-0">
        <div className="mb-6 flex flex-col gap-4 overflow-visible sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-[2.5rem] font-normal leading-none text-[var(--text-primary)] md:text-5xl">
            Dashboard
          </h1>
          <CataloguePortal
            itemCount={profile.resourcesShared}
            onNavigate={() => navigate("/catalogue")}
          />
        </div>
        <BentoGridShowcase
          integrations={
            <ResourceNetworkCard
              availableOwnedResources={availableOwnedResources}
              resourcesShared={profile.resourcesShared}
            />
          }
          mainFeature={<FeaturedResourceCard resource={featuredResource} />}
          featureTags={
            <SignalCard
              pendingRequests={pendingRequests}
              unreadAlerts={unreadAlerts}
              unreadMessages={unreadMessages}
            />
          }
          secondaryFeature={<RequestCard request={nextRequest} />}
          statistic={
            <NetworkStatsCard
              borrowedItems={profile.resourcesBorrowed}
              resourcesShared={profile.resourcesShared}
              schoolCount={mockUsers.length}
            />
          }
          journey={<ActivityJourneyCard activeBorrow={activeBorrow.resource.title} />}
        />
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
    <Card className="h-full overflow-hidden bg-[var(--bg-raised)]">
      <CardHeader>
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Package className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
        </div>
        <CardTitle className="text-lg">Resource Network</CardTitle>
        <CardDescription>
          {availableOwnedResources} available from {resourcesShared} shared items.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3">
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
      </CardContent>
    </Card>
  )
}

interface SignalCardProps {
  pendingRequests: number
  unreadAlerts: number
  unreadMessages: number
}

function SignalCard({
  pendingRequests,
  unreadAlerts,
  unreadMessages,
}: SignalCardProps) {
  return (
    <Card className="h-full bg-[var(--bg-raised)]">
      <CardContent className="flex h-full flex-col justify-center gap-3 p-5">
        <Badge variant="warning" className="w-fit gap-1.5 px-3 py-1.5">
          <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
          {pendingRequests} pending
        </Badge>
        <Badge variant="accent" className="w-fit gap-1.5 px-3 py-1.5">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          {unreadAlerts} alerts
        </Badge>
        <Badge variant="outline" className="w-fit gap-1.5 px-3 py-1.5">
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          {unreadMessages} unread
        </Badge>
      </CardContent>
    </Card>
  )
}

interface FeaturedResourceCardProps {
  resource: (typeof mockResources)[number]
}

function FeaturedResourceCard({ resource }: FeaturedResourceCardProps) {
  return (
    <Card className="relative h-full min-h-[30rem] overflow-hidden border-border bg-[var(--bg-raised)] md:min-h-0">
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
    <Card className="h-full overflow-hidden bg-[var(--bg-raised)]">
      <div className="flex h-full">
        <img
          src={request.resource.images[0]}
          alt={request.resource.title}
          className="hidden w-28 object-cover sm:block"
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
    <Card className="flex h-full flex-col justify-between overflow-hidden bg-[#d7ead2] p-5 text-[#18341e] dark:bg-[#23301f] dark:text-[#e5f6dd]">
      <div className="flex items-center justify-between">
        <CheckCircle2 className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
        <Badge className="border-[#18341e]/15 bg-[#18341e]/10 text-[#18341e] dark:border-[#e5f6dd]/15 dark:bg-[#e5f6dd]/10 dark:text-[#e5f6dd]">
          Live
        </Badge>
      </div>
      <div>
        <p className="font-mono text-7xl font-light leading-none">
          {resourcesShared}
        </p>
        <p className="mt-3 max-w-[14rem] text-sm leading-6">
          Shared theatre resources, {borrowedItems} borrowed items, and{" "}
          {schoolCount} partner schools moving through the same pool.
        </p>
      </div>
    </Card>
  )
}

interface ActivityJourneyCardProps {
  activeBorrow: string
}

function ActivityJourneyCard({ activeBorrow }: ActivityJourneyCardProps) {
  return (
    <Card className="relative h-full overflow-hidden bg-[var(--bg-raised)] p-5">
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
