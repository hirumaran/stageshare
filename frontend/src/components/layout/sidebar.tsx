import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  ArrowLeftRight,
  ShoppingCart,
  MessageSquare,
  User,
  Bell,
  ChevronLeft,
  ChevronRight,
  X,
  Theater,
} from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { useCartStore } from "@/stores/cart-store"
import { useMessageStore } from "@/features/messages/stores/message-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

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

const NAV_BOTTOM: NavItem[] = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/notifications", label: "Notifications", icon: Bell, badge: "notifications" },
]

export function Sidebar() {
  const location = useLocation()
  const {
    sidebarOpen,
    sidebarCollapsed,
    setSidebarOpen,
    setSidebarCollapsed,
    unreadNotificationCount,
  } = useUIStore()
  const totalUnread = useMessageStore((s) => s.totalUnread())
  const cartCount = useCartStore((s) => s.getItemCount())

  function getBadge(type?: "cart" | "messages" | "notifications"): number {
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

  function renderItem(item: NavItem, isBottom = false) {
    const Icon = item.icon
    const active = isActive(item.to)
    const count = getBadge(item.badge)

    return (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={closeMobile}
        className={cn(
          "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground dark:bg-orange-500/10 dark:text-orange-400"
            : "text-sidebar-foreground hover:bg-sidebar-accent dark:hover:bg-zinc-800",
          sidebarCollapsed && "justify-center px-2"
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {!sidebarCollapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {count > 0 && (
              <span
                className={cn(
                  "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  isBottom
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-accent text-accent-foreground"
                )}
              >
                {count}
              </span>
            )}
          </>
        )}
        {sidebarCollapsed && count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {count}
          </span>
        )}
      </NavLink>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar transition-[width,transform] duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "w-14" : "w-60",
          "lg:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className="flex h-14 items-center justify-between border-b px-3">
          {!sidebarCollapsed && (
            <NavLink to="/dashboard" className="flex items-center gap-2">
              <Theater className="h-5 w-5 text-primary" />
              <span className="text-base font-medium tracking-tight text-sidebar-foreground">
                Skēnē
              </span>
            </NavLink>
          )}
          {sidebarCollapsed && (
            <NavLink to="/dashboard" className="mx-auto">
              <Theater className="h-5 w-5 text-primary" />
            </NavLink>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Main nav */}
        <ScrollArea className="flex-1 py-3">
          {!sidebarCollapsed && (
            <p className="px-3 pt-4 pb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600 select-none">
              Platform
            </p>
          )}
          <nav className="flex flex-col gap-0.5 px-2">
            {NAV.map((item) => renderItem(item))}
          </nav>
        </ScrollArea>

        {/* Bottom nav */}
        <div className="border-t p-2">
          {!sidebarCollapsed && (
            <p className="px-3 pt-4 pb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600 select-none">
              Account
            </p>
          )}
          <nav className="flex flex-col gap-0.5">
            {NAV_BOTTOM.map((item) => renderItem(item, true))}
          </nav>

          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 pt-2 hidden w-full justify-center lg:flex border-t border-border/50 rounded-none"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  )
}
