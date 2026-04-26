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
  const totalUnread = useMessageStore((s) => s.totalUnread())
  const cartCount = useCartStore((s) => s.getItemCount())

  function getBadge(type?: BadgeType): number {
    if (type === "cart") return cartCount
    if (type === "messages") return totalUnread
    if (type === "notifications") return unreadNotificationCount
    return 0
  }

  function isActive(to: string) {
    return location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to))
  }

  function closeMobile() {
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }

  function renderItem(item: NavItem) {
    const Icon = item.icon
    const active = isActive(item.to)
    const count = getBadge(item.badge)

    return (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={closeMobile}
        className={cn(
          "group relative flex items-center text-sm font-medium transition-all duration-200",
          sidebarCollapsed
            ? "justify-center rounded-xl w-9 mx-auto py-2.5"
            : "gap-3 rounded-lg px-3 py-2.5 whitespace-nowrap",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground dark:bg-[var(--accent-subtle)] dark:text-[var(--accent)]"
            : "text-sidebar-foreground hover:bg-sidebar-accent dark:hover:bg-[var(--bg-muted)]",
        )}
        title={item.label}
      >
        <Icon
          className={cn("shrink-0", sidebarCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]")}
        />
        <span
          className={cn(
            "truncate transition-all duration-200",
            sidebarCollapsed ? "max-w-0 opacity-0" : "flex-1 opacity-100",
          )}
        >
          {item.label}
        </span>
        {count > 0 && (
          <span
            className={cn(
              "flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground transition-all duration-200",
              sidebarCollapsed ? "max-w-0 opacity-0" : "opacity-100",
            )}
          >
            {count}
          </span>
        )}
        {sidebarCollapsed && count > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
        )}
      </NavLink>
    )
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

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden bg-sidebar transition-all duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed
            ? "w-16 border-r border-border/30"
            : "w-60 border-r border-border/30",
          "lg:translate-x-0",
        )}
      >
        {/* Brand header */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center",
            sidebarCollapsed
              ? "justify-center px-2"
              : "border-b border-border/30 px-3",
          )}
        >
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-[var(--bg-muted)]"
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <Theater className="h-5 w-5" />
            </button>
          ) : (
            <>
              <NavLink
                to="/dashboard"
                className="flex min-w-0 flex-1 items-center gap-2.5"
              >
                <Theater className="h-5 w-5 shrink-0 text-primary" />
                <span className="truncate whitespace-nowrap text-base font-semibold tracking-tight text-sidebar-foreground">
                  Skēnē
                </span>
              </NavLink>

              {/* Collapse button */}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[var(--bg-muted)] hover:text-foreground"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>

              {/* Mobile close button */}
              <Button
                variant="ghost"
                size="icon-sm"
                className="ml-2 shrink-0 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Main nav */}
        <ScrollArea className="flex-1 py-3">
          <p
            className={cn(
              "select-none whitespace-nowrap px-3 pb-1 pt-4 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/60 transition-all duration-200",
              sidebarCollapsed && "max-h-0 opacity-0 py-0",
            )}
          >
            Platform
          </p>
          <nav
            className={cn(
              "flex flex-col gap-0.5",
              sidebarCollapsed ? "" : "px-2",
            )}
          >
            {NAV.map((item) => renderItem(item))}
          </nav>
        </ScrollArea>

        {/* Bottom nav */}
        <div className={cn("p-2", sidebarCollapsed && "px-0")}>
          <p
            className={cn(
              "select-none whitespace-nowrap px-3 pb-1 pt-4 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/60 transition-all duration-200",
              sidebarCollapsed && "max-h-0 opacity-0 py-0",
            )}
          >
            Account
          </p>
          <nav className="flex flex-col gap-0.5">
            {/* Profile */}
            <NavLink
              to="/profile"
              onClick={closeMobile}
              className={cn(
                "group relative flex items-center text-sm font-medium transition-all duration-200",
                sidebarCollapsed
                  ? "justify-center rounded-xl w-9 mx-auto py-2.5"
                  : "gap-3 rounded-lg px-3 py-2.5 whitespace-nowrap",
                profileActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground dark:bg-[var(--accent-subtle)] dark:text-[var(--accent)]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent dark:hover:bg-[var(--bg-muted)]",
              )}
              title="Profile"
            >
              <Avatar
                className={cn(
                  "shrink-0 rounded-full",
                  sidebarCollapsed ? "h-6 w-6" : "h-[18px] w-[18px]",
                )}
              >
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-primary text-[9px] text-primary-foreground">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "truncate transition-all duration-200",
                  sidebarCollapsed ? "max-w-0 opacity-0" : "flex-1 opacity-100",
                )}
              >
                Profile
              </span>
            </NavLink>

            {/* Notifications */}
            <NavLink
              to="/notifications"
              onClick={closeMobile}
              className={cn(
                "group relative flex items-center text-sm font-medium transition-all duration-200",
                sidebarCollapsed
                  ? "justify-center rounded-xl w-9 mx-auto py-2.5"
                  : "gap-3 rounded-lg px-3 py-2.5 whitespace-nowrap",
                notificationsActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground dark:bg-[var(--accent-subtle)] dark:text-[var(--accent)]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent dark:hover:bg-[var(--bg-muted)]",
              )}
              title="Notifications"
            >
              <Bell
                className={cn(
                  "shrink-0",
                  sidebarCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]",
                )}
              />
              <span
                className={cn(
                  "truncate transition-all duration-200",
                  sidebarCollapsed ? "max-w-0 opacity-0" : "flex-1 opacity-100",
                )}
              >
                Notifications
              </span>
              {notificationCount > 0 && (
                <span
                  className={cn(
                    "flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground transition-all duration-200",
                    sidebarCollapsed ? "max-w-0 opacity-0" : "opacity-100",
                  )}
                >
                  {notificationCount}
                </span>
              )}
              {sidebarCollapsed && notificationCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              )}
            </NavLink>
          </nav>
        </div>
      </aside>
    </>
  )
}
