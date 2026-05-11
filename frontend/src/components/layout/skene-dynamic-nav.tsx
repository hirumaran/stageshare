import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeftRight,
  Bell,
  CalendarClock,
  ClipboardList,
  MessageSquare,
  PackagePlus,
  Search,
  Settings,
  Sparkles,
  UserCircle,
  type LucideIcon,
} from "lucide-react"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  currentUser,
  mockBorrowRequests,
  mockNotifications,
  mockResources,
  mockUsers,
} from "@/data/mock-data"
import { useMessageStore } from "@/features/messages/stores/message-store"
import { cn, getInitials } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { useMatrixStore } from "@/stores/matrix-store"
import { useUIStore } from "@/stores/ui-store"

type QuickAction = {
  label: string
  detail: string
  to: string
  icon: LucideIcon
}

const quickActions: QuickAction[] = [
  {
    label: "New Production",
    detail: "Start a show workspace",
    to: "/my-resources",
    icon: Sparkles,
  },
  {
    label: "Add Resource",
    detail: "Share props, kits, scripts",
    to: "/my-resources",
    icon: PackagePlus,
  },
  {
    label: "Borrow Request",
    detail: "Review pending loans",
    to: "/borrowing",
    icon: ArrowLeftRight,
  },
  {
    label: "Message Teacher",
    detail: "Open conversations",
    to: "/messages",
    icon: MessageSquare,
  },
]

function CountPill({ count }: { count: number }) {
  if (count <= 0) return null

  return (
    <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[0.6rem] leading-none text-primary-foreground shadow-sm">
      {count > 9 ? "9+" : count}
    </span>
  )
}

interface NavIconButtonProps {
  label: string
  icon: LucideIcon
  count?: number
  onClick: () => void
}

function NavIconButton({ label, icon: Icon, count = 0, onClick }: NavIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative grid h-10 w-10 place-items-center rounded-full text-[#172033]/75 transition-colors hover:bg-black/5 hover:text-[#172033] focus-visible:ring-2 focus-visible:ring-primary dark:text-[#EDE7DD]/80 dark:hover:bg-white/10 dark:hover:text-[#EDE7DD]"
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.65} aria-hidden="true" />
      <CountPill count={count} />
    </button>
  )
}

interface CommandResultProps {
  label: string
  detail: string
  to: string
  onSelect: (to: string) => void
}

function CommandResult({ label, detail, to, onSelect }: CommandResultProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(to)}
      className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white/25 px-3 py-2.5 text-left transition-colors hover:bg-white/45 focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-[#172033] dark:text-[#EDE7DD]">
          {label}
        </span>
        <span className="block truncate text-xs text-[#5f6573] dark:text-[#B8B0A6]">
          {detail}
        </span>
      </span>
      <span className="text-xs text-primary">Open</span>
    </button>
  )
}

export function SkeneDynamicNav() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const shellRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    notifications,
    unreadNotificationCount,
    borrowRequests,
    fetchNotifications,
    fetchBorrowRequests,
  } = useUIStore()
  const mockTotalUnread = useMessageStore((state) => state.totalUnread())
  const matrixUnread = useMatrixStore((state) => state.getUnreadCount())
  const matrixReady = useMatrixStore((state) => state.isReady)
  const profile = user ?? currentUser
  const unreadMessages = matrixReady ? matrixUnread : mockTotalUnread
  const activeNotifications = notifications.length > 0 ? notifications : mockNotifications
  const activeRequests = borrowRequests.length > 0 ? borrowRequests : mockBorrowRequests
  const pendingRequests = activeRequests.filter(
    (request) => request.status === "pending",
  ).length
  const unreadAlerts =
    unreadNotificationCount ||
    activeNotifications.filter((notification) => !notification.read).length
  const totalAttention = unreadAlerts + unreadMessages + pendingRequests

  const commandResults = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []

    const resources = mockResources.map((resource) => ({
      label: resource.title,
      detail: `${resource.category} · ${resource.status}`,
      to: `/resource/${resource.id}`,
    }))
    const people = mockUsers.map((person) => ({
      label: person.name,
      detail: person.school ?? person.email,
      to: "/messages",
    }))

    return [...resources, ...people]
      .filter((item) =>
        `${item.label} ${item.detail}`.toLowerCase().includes(normalized),
      )
      .slice(0, 4)
  }, [query])

  function go(to: string) {
    setOpen(false)
    setQuery("")
    navigate(to)
  }

  useEffect(() => {
    fetchNotifications()
    fetchBorrowRequests()
  }, [fetchBorrowRequests, fetchNotifications])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (
        shellRef.current &&
        !shellRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  return (
    <motion.div
      ref={shellRef}
      layout
      className="fixed right-4 top-4 z-40 max-w-[calc(100vw-2rem)] md:right-8"
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 360, damping: 34 }}
        className={cn(
          "relative overflow-hidden border border-black/10 bg-[#f7f1e8]/55 shadow-[0_12px_40px_rgba(40,30,20,0.16)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[#f7f1e8]/45",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/10 before:to-transparent",
          "dark:border-white/10 dark:bg-[#1c1917]/35 dark:shadow-[0_12px_48px_rgba(0,0,0,0.35)] dark:supports-[backdrop-filter]:bg-[#1c1917]/25",
          open
            ? "w-[min(calc(100vw-2rem),28rem)] rounded-[1.75rem] p-3"
            : "w-auto rounded-full p-1.5",
        )}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              aria-label={open ? "Close command panel" : "Open command panel"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              className={cn(
                "flex h-10 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-medium text-[#172033]/80 transition-colors hover:bg-black/5 hover:text-[#172033] focus-visible:ring-2 focus-visible:ring-primary dark:text-[#EDE7DD]/85 dark:hover:bg-white/10 dark:hover:text-[#EDE7DD]",
                open && "bg-black/5 dark:bg-white/10",
              )}
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.65} />
              <span className={cn("hidden sm:inline", open && "inline")}>
                Command
              </span>
            </button>

            <NavIconButton
              label="Open alerts"
              icon={Bell}
              count={unreadAlerts}
              onClick={() => go("/notifications")}
            />
            <NavIconButton
              label="Open settings"
              icon={Settings}
              onClick={() => go("/settings")}
            />
            <AnimatedThemeToggler className="h-10 w-10 text-[#172033]/80 focus-visible:ring-2 focus-visible:ring-primary dark:text-[#EDE7DD]/85 [&_svg]:h-[18px] [&_svg]:w-[18px]" />
            <button
              type="button"
              aria-label="Open profile"
              onClick={() => go("/profile")}
              className="ml-0.5 hidden h-10 w-10 place-items-center rounded-full transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-primary sm:grid"
            >
              <Avatar className="h-8 w-8 border border-white/25 shadow-sm">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="font-mono text-[0.65rem]">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>

          <AnimatePresence>
            {open && (
              <motion.div
                key="dynamic-nav-panel"
                initial={{ opacity: 0, y: -8, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="mt-3 space-y-3"
                role="dialog"
                aria-label="Skene command panel"
              >
                <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />

                <label className="flex h-11 items-center gap-2 rounded-2xl border border-black/10 bg-white/30 px-3 text-[#172033] shadow-inner shadow-white/20 focus-within:ring-2 focus-within:ring-primary dark:border-white/10 dark:bg-black/20 dark:text-[#EDE7DD]">
                  <Search
                    className="h-4 w-4 text-[#697181] dark:text-[#B8B0A6]"
                    strokeWidth={1.6}
                  />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search resources, people, requests"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#697181] dark:placeholder:text-[#B8B0A6]"
                    autoFocus
                  />
                </label>

                {query ? (
                  <div className="space-y-2">
                    {commandResults.length > 0 ? (
                      commandResults.map((item) => (
                        <CommandResult
                          key={`${item.to}-${item.label}`}
                          {...item}
                          onSelect={go}
                        />
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-black/10 px-3 py-4 text-sm text-[#5f6573] dark:border-white/10 dark:text-[#B8B0A6]">
                        No matching resources or teachers.
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="mb-2 font-label text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#6e6256] dark:text-[#B8B0A6]">
                        Quick Actions
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {quickActions.map((action) => {
                          const Icon = action.icon
                          return (
                            <button
                              key={action.label}
                              type="button"
                              onClick={() => go(action.to)}
                              className="group rounded-2xl border border-black/5 bg-white/25 p-3 text-left transition-colors hover:bg-white/45 focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                            >
                              <Icon
                                className="mb-3 h-4 w-4 text-primary transition-transform group-hover:scale-110"
                                strokeWidth={1.7}
                              />
                              <span className="block text-sm font-medium text-[#172033] dark:text-[#EDE7DD]">
                                {action.label}
                              </span>
                              <span className="mt-1 block text-xs leading-4 text-[#5f6573] dark:text-[#B8B0A6]">
                                {action.detail}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-[1.1fr_0.9fr]">
                      <div className="rounded-2xl border border-black/5 bg-white/25 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="font-label text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#6e6256] dark:text-[#B8B0A6]">
                            Alerts
                          </p>
                          <button
                            type="button"
                            onClick={() => go("/notifications")}
                            className="text-xs font-medium text-primary hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            View all
                          </button>
                        </div>
                        <div className="space-y-2">
                          {activeNotifications.slice(0, 2).map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => go(notification.actionUrl ?? "/notifications")}
                              className="flex w-full items-start gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-primary dark:hover:bg-white/10"
                            >
                              <span
                                className={cn(
                                  "mt-1.5 h-2 w-2 rounded-full",
                                  notification.read
                                    ? "bg-[#8b8075] dark:bg-[#6f675f]"
                                    : "bg-[#C58A3A]",
                                )}
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-medium text-[#172033] dark:text-[#EDE7DD]">
                                  {notification.title}
                                </span>
                                <span className="line-clamp-1 text-xs text-[#5f6573] dark:text-[#B8B0A6]">
                                  {notification.message}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-black/5 bg-white/25 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="mb-3 font-label text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#6e6256] dark:text-[#B8B0A6]">
                          Today
                        </p>
                        <div className="space-y-2 text-sm">
                          <button
                            type="button"
                            onClick={() => go("/borrowing")}
                            className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-primary dark:hover:bg-white/10"
                          >
                            <ClipboardList className="h-4 w-4 text-[#C58A3A]" />
                            <span>
                              <span className="block font-medium text-[#172033] dark:text-[#EDE7DD]">
                                {pendingRequests} pending
                              </span>
                              <span className="block text-xs text-[#5f6573] dark:text-[#B8B0A6]">
                                Borrow requests
                              </span>
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => go("/messages")}
                            className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-primary dark:hover:bg-white/10"
                          >
                            <MessageSquare className="h-4 w-4 text-primary" />
                            <span>
                              <span className="block font-medium text-[#172033] dark:text-[#EDE7DD]">
                                {unreadMessages} unread
                              </span>
                              <span className="block text-xs text-[#5f6573] dark:text-[#B8B0A6]">
                                Teacher messages
                              </span>
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => go("/catalogue")}
                            className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-primary dark:hover:bg-white/10"
                          >
                            <CalendarClock className="h-4 w-4 text-[#71804A]" />
                            <span>
                              <span className="block font-medium text-[#172033] dark:text-[#EDE7DD]">
                                {profile.resourcesShared} shared
                              </span>
                              <span className="block text-xs text-[#5f6573] dark:text-[#B8B0A6]">
                                Catalogue items
                              </span>
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-[#172033]/5 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-primary" />
                        <span className="text-sm text-[#172033] dark:text-[#EDE7DD]">
                          {profile.school ?? "School profile"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => go("/settings")}
                        className="text-xs font-medium text-primary hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        Settings
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {!open && totalAttention > 0 && (
        <span className="pointer-events-none absolute -bottom-1 right-3 h-1.5 w-1.5 rounded-full bg-[#C58A3A] shadow-[0_0_16px_rgba(197,138,58,0.75)]" />
      )}
    </motion.div>
  )
}
