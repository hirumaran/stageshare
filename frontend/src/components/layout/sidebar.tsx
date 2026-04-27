import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  ArrowLeftRight,
  ShoppingCart,
  MessageSquare,
  Bell,
  PanelLeftClose,
  X,
  Theater,
} from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { useCartStore } from "@/stores/cart-store"
import { useMessageStore } from "@/features/messages/stores/message-store"
import { useMatrixStore } from "@/stores/matrix-store"
import { useAuthStore } from "@/stores/auth-store"
import { cn, getInitials } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type BadgeType = "cart" | "messages" | "notifications"

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  badge?: BadgeType
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/catalogue", label: "Catalogue", icon: BookOpen },
  { to: "/my-resources", label: "My Resources", icon: FolderOpen },
  { to: "/borrowing", label: "Borrowing", icon: ArrowLeftRight },
  { to: "/cart", label: "Cart", icon: ShoppingCart, badge: "cart" },
  { to: "/messages", label: "Messages", icon: MessageSquare, badge: "messages" },
]

// ═══════════════════════════════════════════════════════
// RAIL ITEM — 44×44, dead-center, NO theme variables
// ═══════════════════════════════════════════════════════
function RailItem({
  to,
  active,
  label,
  badge,
  onClick,
  children,
}: {
  to: string
  active: boolean
  label: string
  badge?: number
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      title={label}
      onClick={onClick}
      className={cn(
        "relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
        active
          ? "bg-[#6366F1]/15 text-[#6366F1] [box-shadow:inset_0_0_0_1px_rgba(99,102,241,0.25)]"
          : "text-[#71717A] hover:bg-[#27272A] hover:text-[#D4D4D8]"
      )}
    >
      {children}
      {!!badge && badge > 0 && (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#6366F1]" />
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const location = useLocation()
  const { user } = useAuthStore()
  const {
    sidebarOpen,
    sidebarCollapsed,
    setSidebarOpen,
    setSidebarCollapsed,
    unreadNotificationCount,
  } = useUIStore()
  const mockTotalUnread = useMessageStore((s) => s.totalUnread())
  const matrixUnread = useMatrixStore((s) => s.getUnreadCount())
  const matrixReady = useMatrixStore((s) => s.isReady)
  const cartCount = useCartStore((s) => s.getItemCount())

  function getBadge(type?: BadgeType): number {
    if (type === "cart") return cartCount
    if (type === "messages") return matrixReady ? matrixUnread : mockTotalUnread
    if (type === "notifications") return unreadNotificationCount
    return 0
  }

  function isActive(to: string) {
    return location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to))
  }

  function closeMobile() {
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }

  const profileActive = isActive("/profile")
  const notificationsActive = isActive("/notifications")
  const notificationCount = getBadge("notifications")

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden bg-sidebar transition-all duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "w-16" : "w-60",
          "lg:translate-x-0",
          "border-r border-[#27272A]"
        )}
      >
        {sidebarCollapsed ? (
          /* ═══════════════════════════════════════
             COLLAPSED RAIL — RIGID GRID
             ═══════════════════════════════════════ */
          <div className="flex h-full w-16 flex-col items-center">
            {/* Brand */}
            <div className="flex h-14 shrink-0 items-center justify-center">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-primary transition-colors hover:bg-[#27272A]"
                aria-label="Open sidebar"
              >
                <Theater className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Main nav */}
            <nav className="flex flex-1 flex-col items-center gap-2 pt-2">
              {NAV.map((item) => {
                const active = isActive(item.to)
                const Icon = item.icon
                const count = getBadge(item.badge)
                return (
                  <RailItem
                    key={item.to}
                    to={item.to}
                    active={active}
                    label={item.label}
                    badge={count}
                    onClick={closeMobile}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </RailItem>
                )
              })}
            </nav>

            {/* Bottom nav */}
            <div className="flex flex-col items-center gap-3 pb-4">
              <RailItem
                to="/profile"
                active={profileActive}
                label="Profile"
                onClick={closeMobile}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-[#6366F1] text-[10px] text-white">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </RailItem>

              <RailItem
                to="/notifications"
                active={notificationsActive}
                label="Notifications"
                badge={notificationCount}
                onClick={closeMobile}
              >
                <Bell className="h-5 w-5" strokeWidth={1.5} />
              </RailItem>
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════
             EXPANDED SIDEBAR
             ═══════════════════════════════════════ */
          <>
            {/* Header */}
            <div className="flex h-14 shrink-0 items-center border-b border-border/30 px-3">
              <NavLink to="/dashboard" className="flex min-w-0 flex-1 items-center gap-2.5">
                <Theater className="h-5 w-5 shrink-0 text-primary" />
                <span className="truncate whitespace-nowrap text-base font-semibold tracking-tight text-sidebar-foreground">
                  Skēnē
                </span>
              </NavLink>

              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[var(--bg-muted)] hover:text-foreground"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>

              <Button
                variant="ghost"
                size="icon-sm"
                className="ml-2 shrink-0 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Main nav */}
            <ScrollArea className="flex-1 py-3">
              <p className="select-none whitespace-nowrap px-3 pb-1 pt-4 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/60">
                Platform
              </p>
              <nav className="flex flex-col gap-0.5 px-2">
                {NAV.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.to)
                  const count = getBadge(item.badge)

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeMobile}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200",
                        active
                          ? "border-[#6366F1] bg-[#6366F1]/5 text-sidebar-foreground"
                          : "border-transparent text-sidebar-foreground hover:bg-sidebar-accent",
                      )}
                      title={item.label}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {count > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
                          {count}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </nav>
            </ScrollArea>

            {/* Bottom nav */}
            <div className="p-2">
              <p className="select-none whitespace-nowrap px-3 pb-1 pt-4 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/60">
                Account
              </p>
              <nav className="flex flex-col gap-0.5">
                <NavLink
                  to="/profile"
                  onClick={closeMobile}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200",
                    profileActive
                      ? "border-[#6366F1] bg-[#6366F1]/5 text-sidebar-foreground"
                      : "border-transparent text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                  title="Profile"
                >
                  <Avatar className="h-[18px] w-[18px]">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-primary text-[9px] text-primary-foreground">
                      {user?.name ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate">Profile</span>
                </NavLink>

                <NavLink
                  to="/notifications"
                  onClick={closeMobile}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200",
                    notificationsActive
                      ? "border-[#6366F1] bg-[#6366F1]/5 text-sidebar-foreground"
                      : "border-transparent text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                  title="Notifications"
                >
                  <Bell className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1 truncate">Notifications</span>
                  {notificationCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
                      {notificationCount}
                    </span>
                  )}
                </NavLink>
              </nav>
            </div>
          </>
        )}
      </aside>
    </>
  )
}