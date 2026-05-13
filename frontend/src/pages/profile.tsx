import { Link } from "react-router-dom"
import type { MouseEvent } from "react"
import {
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock3,
  Edit3,
  GraduationCap,
  Mail,
  MessageSquare,
  PackageOpen,
  ShieldCheck,
  ShoppingCart,
  Star,
} from "lucide-react"
import { toast } from "sonner"
import { mockResources } from "@/data/mock-data"
import { useAuthStore } from "@/stores/auth-store"
import { useCartStore } from "@/stores/cart-store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Resource } from "@/types"
import { cn, formatDate, getInitials, truncate } from "@/lib/utils"

const CATEGORY_LABEL: Record<Resource["category"], string> = {
  scripts: "Scripts",
  "lesson-plans": "Lesson plans",
  costumes: "Costumes",
  props: "Props",
  lighting: "Lighting",
  sound: "Sound",
  "set-design": "Set design",
  makeup: "Makeup",
  music: "Music",
  other: "Other",
}

const CONDITION_LABEL: Record<Resource["condition"], string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  worn: "Worn",
}

const STATUS_STYLE: Record<Resource["status"], string> = {
  available:
    "border-emerald-300/25 bg-emerald-300/12 text-emerald-100",
  borrowed: "border-amber-300/25 bg-amber-300/12 text-amber-100",
  reserved: "border-indigo-300/25 bg-indigo-300/12 text-indigo-100",
  unavailable: "border-white/10 bg-white/[0.05] text-stone-300",
}

const goldBorder = "border-[#c6a66b]/22"
const glassSurface =
  "border border-[#c6a66b]/18 bg-[#17130f]/78 shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl"
const quietGlass =
  "border border-[#c6a66b]/14 bg-[#1c1713]/72 backdrop-blur-xl"

function makeHandle(name: string) {
  return `@${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "")}`
}

function getTopCategory(resources: Resource[]) {
  const counts = resources.reduce<Partial<Record<Resource["category"], number>>>(
    (acc, resource) => {
      acc[resource.category] = (acc[resource.category] ?? 0) + 1
      return acc
    },
    {},
  )
  const [category] =
    Object.entries(counts).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))[0] ?? []

  return category ? CATEGORY_LABEL[category as Resource["category"]] : "None yet"
}

function ProfileStat({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-[1rem] border border-[#c6a66b]/18 bg-[linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition-colors duration-200 hover:border-[#c6a66b]/30 motion-reduce:transition-none">
      <p className="font-serif text-3xl leading-none text-[#f7efe3]">{value}</p>
      <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#b8aa96]">
        {label}
      </p>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-[1rem] border border-[#c6a66b]/14 bg-white/[0.035] p-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8f98ff]/12 text-[#aeb5ff]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9e927f]">
          {label}
        </p>
        <p className="mt-1 break-words text-sm text-[#eee7dc]">{value}</p>
      </div>
    </div>
  )
}

function ResourceArchiveCard({
  resource,
  isOwnerProfile,
}: {
  resource: Resource
  isOwnerProfile: boolean
}) {
  const { addItem, isInCart } = useCartStore()
  const inCart = isInCart(resource.id)
  const available = resource.status === "available"

  function handleRequest(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()

    if (!available) {
      toast.error("This resource is not available for borrowing")
      return
    }
    if (inCart) {
      toast.info("Already in cart")
      return
    }

    const start = new Date()
    const end = new Date()
    end.setDate(end.getDate() + 14)
    addItem(resource, start.toISOString(), end.toISOString())
    toast.success("Added to cart")
  }

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-[1.15rem] transition-colors duration-200 hover:border-[#c6a66b]/28 motion-reduce:transition-none",
        quietGlass,
      )}
    >
      <Link
        to={`/resource/${resource.id}`}
        className="block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aeb5ff]"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-[#11100e]">
          {resource.images[0] ? (
            <img
              src={resource.images[0]}
              alt={resource.title}
              className="h-full w-full object-cover brightness-[0.78] saturate-[0.86] transition-transform duration-300 ease-out group-hover:scale-[1.018] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="h-10 w-10 text-white/25" aria-hidden="true" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(15,12,9,0.72),rgba(15,12,9,0.10)_52%,transparent)]" />
          <Badge
            className={cn(
              "absolute right-3 top-3 capitalize backdrop-blur-md",
              STATUS_STYLE[resource.status],
            )}
          >
            {resource.status}
          </Badge>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge className="border-[#c6a66b]/18 bg-[#c6a66b]/10 text-[#ead9b8]">
            {CATEGORY_LABEL[resource.category]}
          </Badge>
          <span className="text-[#a89d8c]">
            {CONDITION_LABEL[resource.condition]}
          </span>
        </div>

        <Link
          to={`/resource/${resource.id}`}
          className="mt-3 block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aeb5ff]"
        >
          <h3 className="text-[0.95rem] font-semibold leading-snug text-[#f1eadf] transition-colors duration-200 group-hover:text-[#d9dcff] motion-reduce:transition-none">
            {truncate(resource.title, 70)}
          </h3>
        </Link>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#a89d8c]">
          <div className="flex items-center gap-1.5">
            <Star
              className="h-3.5 w-3.5 fill-[#d7b469] text-[#d7b469]"
              aria-hidden="true"
            />
            <span className="font-medium text-[#eee7dc]">
              {resource.rating.toFixed(1)}
            </span>
            <span>({resource.reviewCount})</span>
          </div>
          <span>{resource.borrowCount} borrows</span>
        </div>

        {isOwnerProfile ? (
          <Button
            size="sm"
            variant="outline"
            className="mt-4 min-h-9 w-full cursor-pointer border-[#c6a66b]/18 bg-white/[0.035] text-[#efe6d8] hover:bg-[#c6a66b]/10"
            asChild
          >
            <Link to="/my-resources">
              <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
              Manage listing
            </Link>
          </Button>
        ) : (
          available && (
            <Button
              size="sm"
              className="mt-4 min-h-9 w-full cursor-pointer bg-[#8f98ff] text-[#11100f] hover:bg-[#aeb5ff]"
              onClick={handleRequest}
            >
              <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
              {inCart ? "In cart" : "Request to borrow"}
            </Button>
          )
        )}
      </div>
    </article>
  )
}

export default function ProfilePage() {
  const { user: currentUser } = useAuthStore()

  const profileUser = currentUser
  const isOwnProfile = true

  if (!profileUser) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-12 md:px-8">
        <div className={cn("rounded-[1.25rem] p-12 text-center", glassSurface)}>
          <PackageOpen className="mx-auto h-10 w-10 text-[#aeb5ff]" />
          <p className="mt-4 text-sm text-[#cfc4b4]">User not found</p>
        </div>
      </div>
    )
  }

  const userResources = mockResources.filter((r) => r.ownerId === profileUser.id)
  const availableResources = userResources.filter((r) => r.status === "available")
  const totalBorrowCount = userResources.reduce((sum, r) => sum + r.borrowCount, 0)
  const averageRating =
    userResources.length > 0
      ? userResources.reduce((sum, r) => sum + r.rating, 0) / userResources.length
      : 0
  const profileHandle = makeHandle(profileUser.name)
  const topCategory = getTopCategory(userResources)
  const joinedLabel = formatDate(profileUser.joinedAt)

  return (
    <div className="relative isolate mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-[-4.5rem] -z-10 mx-auto h-[34rem] max-w-5xl rounded-full bg-[radial-gradient(circle_at_center,rgba(198,166,107,0.14),rgba(143,152,255,0.08)_34%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />

      <section
        className={cn(
          "relative min-h-[360px] overflow-hidden rounded-[1.75rem] p-5 md:min-h-[390px] md:p-7 lg:p-8",
          glassSurface,
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f4d58f]/45 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#f4d58f]/8 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-28 left-12 h-72 w-72 rounded-full bg-[#8f98ff]/8 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative grid h-full gap-7 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-stretch">
          <div className="flex min-w-0 flex-col justify-center">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Avatar className="h-24 w-24 border border-[#f4d58f]/25 bg-[#110f0d] shadow-[0_16px_42px_rgba(0,0,0,0.35)] ring-4 ring-black/20">
                <AvatarImage src={profileUser.avatar} alt={profileUser.name} />
                <AvatarFallback className="bg-[#2a241d] text-xl text-[#f4eadb]">
                  {getInitials(profileUser.name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex min-h-7 items-center rounded-full border border-[#f4d58f]/22 bg-[#f4d58f]/8 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#ead9b8]">
                    Drama educator
                  </span>
                  <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-emerald-300/22 bg-emerald-300/10 px-3 text-xs font-medium text-emerald-100">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Verified
                  </span>
                </div>

                <h1 className="mt-4 font-serif text-4xl leading-[0.98] text-[#f7efe3] md:text-6xl">
                  {profileUser.name}
                </h1>
                <p className="mt-2 text-sm text-[#a99f91]">{profileHandle}</p>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#cfc4b4]">
                  {profileUser.school && (
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-[#aeb5ff]" />
                      {profileUser.school}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-[#aeb5ff]" />
                    Joined {joinedLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#aeb5ff]" />
                    {availableResources.length} available
                  </span>
                </div>

                {profileUser.bio && (
                  <p className="mt-5 max-w-2xl text-base leading-7 text-[#e5dac9]">
                    {profileUser.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          <aside className="flex flex-col justify-between gap-5 rounded-[1.25rem] border border-[#c6a66b]/14 bg-black/[0.13] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
            <div className="flex justify-end">
              {isOwnProfile ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-9 cursor-pointer border-[#c6a66b]/20 bg-white/[0.035] px-4 text-[#f4eadb] hover:bg-[#c6a66b]/10"
                  asChild
                >
                  <Link to="/settings">
                    <Edit3 className="h-4 w-4" aria-hidden="true" />
                    Edit profile
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-9 cursor-pointer border-[#c6a66b]/20 bg-white/[0.035] px-4 text-[#f4eadb] hover:bg-[#c6a66b]/10"
                  asChild
                >
                  <Link to={`/messages?user=${profileUser.id}`}>
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    Message
                  </Link>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ProfileStat label="Shared" value={profileUser.resourcesShared} />
              <ProfileStat label="Borrowed" value={profileUser.resourcesBorrowed} />
              <ProfileStat label="Circulation" value={totalBorrowCount} />
              <ProfileStat
                label="Rating"
                value={averageRating ? averageRating.toFixed(1) : "New"}
              />
            </div>
          </aside>
        </div>
      </section>

      <Tabs defaultValue="resources" className="mt-7">
        <section className={cn("rounded-[1.5rem] p-5 md:p-6", glassSurface)}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b8aa96]">
                Shared resources
              </p>
              <h2 className="mt-2 font-serif text-3xl text-[#f7efe3]">
                Sarah&apos;s Shelf
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#cfc4b4]">
                A curated archive of classroom-ready scripts, lesson materials,
                and production resources.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <TabsList className="h-auto w-fit rounded-full border border-[#c6a66b]/14 bg-black/20 p-1 text-[#a99f91]">
                <TabsTrigger
                  value="resources"
                  className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-[#f4eadb] data-[state=active]:text-[#15110d] data-[state=active]:shadow-none"
                >
                  Resources ({userResources.length})
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-[#f4eadb] data-[state=active]:text-[#15110d] data-[state=active]:shadow-none"
                >
                  About
                </TabsTrigger>
              </TabsList>

              <Button
                variant="ghost"
                className="min-h-10 w-fit cursor-pointer text-[#f4eadb] hover:bg-[#c6a66b]/10"
                asChild
              >
                <Link to="/my-resources">
                  Manage shelf
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          <TabsContent value="resources" className="mt-6">
            {userResources.length === 0 ? (
              <div className={cn("rounded-[1.15rem] p-12 text-center", quietGlass)}>
                <PackageOpen className="mx-auto h-10 w-10 text-[#aeb5ff]" />
                <p className="mt-4 text-sm text-[#cfc4b4]">
                  No resources shared yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {userResources.map((resource) => (
                  <ResourceArchiveCard
                    key={resource.id}
                    resource={resource}
                    isOwnerProfile={isOwnProfile}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className={cn("rounded-[1.15rem] p-5 md:p-6", quietGlass)}>
                <h3 className="font-serif text-2xl text-[#f7efe3]">
                  Profile details
                </h3>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <DetailRow
                    icon={Mail}
                    label="Email"
                    value={profileUser.email}
                  />
                  {profileUser.school && (
                    <DetailRow
                      icon={GraduationCap}
                      label="School"
                      value={profileUser.school}
                    />
                  )}
                  <DetailRow
                    icon={Calendar}
                    label="Member since"
                    value={joinedLabel}
                  />
                  <DetailRow
                    icon={Clock3}
                    label="Borrowing rhythm"
                    value="Two-week classroom cycles"
                  />
                </div>
              </div>

              <aside className={cn("rounded-[1.15rem] p-5", quietGlass)}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b8aa96]">
                  Shelf summary
                </p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#a99f91]">Primary shelf</span>
                    <span className="font-medium text-[#f4eadb]">{topCategory}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#a99f91]">Available now</span>
                    <span className="font-medium text-[#f4eadb]">
                      {availableResources.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#a99f91]">Reply pace</span>
                    <span className="font-medium text-[#f4eadb]">Same day</span>
                  </div>
                </div>
              </aside>
            </div>
          </TabsContent>
        </section>
      </Tabs>
    </div>
  )
}
