import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  Bell,
  CalendarClock,
  ClipboardList,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import {
  mockBorrowRequests,
  mockConversations,
  mockNotifications,
} from "@/data/mock-data"
import { useMessageStore } from "@/features/messages/stores/message-store"
import { cn } from "@/lib/utils"
import { useMatrixStore } from "@/stores/matrix-store"
import { useUIStore } from "@/stores/ui-store"

interface UtilityButtonProps {
  label: string
  icon: LucideIcon
  count?: number
  active?: boolean
  onClick: () => void
}

function UtilityButton({
  label,
  icon: Icon,
  count = 0,
  active,
  onClick,
}: UtilityButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={active}
      onClick={onClick}
      className={cn(
        "relative grid h-9 w-9 place-items-center rounded-full text-[#172033]/75 transition-colors hover:bg-black/5 hover:text-[#172033] focus-visible:ring-2 focus-visible:ring-primary dark:text-[#EDE7DD]/85 dark:hover:bg-white/10 dark:hover:text-[#EDE7DD]",
        active && "bg-black/5 text-[#172033] dark:bg-white/10 dark:text-[#EDE7DD]",
      )}
    >
      <Icon className="h-[17px] w-[17px]" strokeWidth={1.65} aria-hidden="true" />
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 grid min-h-4 min-w-4 translate-x-1/3 -translate-y-1/3 place-items-center rounded-full bg-primary px-1 font-mono text-[0.58rem] leading-none text-primary-foreground shadow-sm">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  )
}

export function SkeneDynamicNav() {
  const [alertsOpen, setAlertsOpen] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const {
    notifications,
    unreadNotificationCount,
    fetchNotifications,
  } = useUIStore()
  const mockTotalUnread = useMessageStore((state) => state.totalUnread())
  const matrixUnread = useMatrixStore((state) => state.getUnreadCount())
  const matrixReady = useMatrixStore((state) => state.isReady)
  const unreadMessages = matrixReady ? matrixUnread : mockTotalUnread
  const activeNotifications = notifications.length > 0 ? notifications : mockNotifications
  const unreadAlerts =
    unreadNotificationCount ||
    activeNotifications.filter((notification) => !notification.read).length
  const pendingRequest = mockBorrowRequests.find(
    (request) => request.status === "pending",
  )
  const dueSoon = mockNotifications.find(
    (notification) => notification.type === "reminder",
  )

  function go(to: string) {
    setAlertsOpen(false)
    navigate(to)
  }

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (!alertsOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (
        shellRef.current &&
        !shellRef.current.contains(event.target as Node)
      ) {
        setAlertsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAlertsOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [alertsOpen])

  return (
    <motion.div
      ref={shellRef}
      layout
      className="fixed right-4 top-5 z-40 max-w-[calc(100vw-2rem)] md:right-8 lg:right-10 lg:top-6"
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 360, damping: 34 }}
        className={cn(
          "relative flex h-12 items-center gap-2 overflow-visible rounded-full border border-black/10 bg-[#f7f1e8]/55 px-2.5 shadow-[0_12px_40px_rgba(40,30,20,0.16)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[#f7f1e8]/45",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/10 before:to-transparent",
          "dark:border-white/10 dark:bg-[#1c1917]/45 dark:shadow-[0_12px_40px_rgba(0,0,0,0.32)] dark:supports-[backdrop-filter]:bg-[#1c1917]/35",
        )}
      >
        <div className="relative z-10 flex items-center gap-1.5">
          <UtilityButton
            label="Open alerts"
            icon={Bell}
            count={unreadAlerts}
            active={alertsOpen}
            onClick={() => setAlertsOpen((open) => !open)}
          />
          <UtilityButton
            label="Open settings"
            icon={Settings}
            onClick={() => go("/settings")}
          />
          <AnimatedThemeToggler className="h-9 w-9 text-[#172033]/75 focus-visible:ring-2 focus-visible:ring-primary dark:text-[#EDE7DD]/85 [&_svg]:h-[17px] [&_svg]:w-[17px]" />
        </div>
      </motion.div>

      <AnimatePresence>
        {alertsOpen && (
          <motion.div
            key="alerts-popover"
            initial={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(8px)" }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-[min(calc(100vw-2rem),21rem)] rounded-[1.5rem] border border-black/10 bg-[#f7f1e8]/70 p-3 shadow-[0_18px_52px_rgba(40,30,20,0.2)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-[#1c1917]/82 dark:shadow-[0_18px_58px_rgba(0,0,0,0.42)]"
            role="dialog"
            aria-label="Alerts"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg leading-none text-[#172033] dark:text-[#F0E9DF]">
                  Alerts
                </h2>
                <p className="mt-1 text-xs text-[#5f6573] dark:text-[#B8B0A6]">
                  {unreadAlerts} unread, {unreadMessages} message
                  {unreadMessages === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => go("/notifications")}
                className="rounded-full px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary"
              >
                View all
              </button>
            </div>

            <div className="space-y-2">
              {pendingRequest && (
                <button
                  type="button"
                  onClick={() => go("/borrowing")}
                  className="flex w-full items-start gap-3 rounded-2xl border border-black/5 bg-white/30 p-3 text-left transition-colors hover:bg-white/50 focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-black/20 dark:hover:bg-white/[0.08]"
                >
                  <ClipboardList className="mt-0.5 h-4 w-4 text-[#C58A3A]" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[#172033] dark:text-[#F0E9DF]">
                      Pending borrow request
                    </span>
                    <span className="line-clamp-1 text-xs text-[#5f6573] dark:text-[#B8B0A6]">
                      {pendingRequest.borrower.name} requested{" "}
                      {pendingRequest.resource.title}
                    </span>
                  </span>
                </button>
              )}

              {dueSoon && (
                <button
                  type="button"
                  onClick={() => go(dueSoon.actionUrl ?? "/notifications")}
                  className="flex w-full items-start gap-3 rounded-2xl border border-black/5 bg-white/30 p-3 text-left transition-colors hover:bg-white/50 focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-black/20 dark:hover:bg-white/[0.08]"
                >
                  <CalendarClock className="mt-0.5 h-4 w-4 text-[#71804A]" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[#172033] dark:text-[#F0E9DF]">
                      Resource due soon
                    </span>
                    <span className="line-clamp-1 text-xs text-[#5f6573] dark:text-[#B8B0A6]">
                      {dueSoon.message}
                    </span>
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => go("/messages")}
                className="flex w-full items-start gap-3 rounded-2xl border border-black/5 bg-white/30 p-3 text-left transition-colors hover:bg-white/50 focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-black/20 dark:hover:bg-white/[0.08]"
              >
                <MessageSquare className="mt-0.5 h-4 w-4 text-primary" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-[#172033] dark:text-[#F0E9DF]">
                    Unread messages
                  </span>
                  <span className="line-clamp-1 text-xs text-[#5f6573] dark:text-[#B8B0A6]">
                    {unreadMessages > 0
                      ? `${unreadMessages} teacher message${unreadMessages === 1 ? "" : "s"} waiting`
                      : "No unread teacher messages"}
                  </span>
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
