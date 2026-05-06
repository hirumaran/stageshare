import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  ArrowLeftRight,
  Bell,
  CircleHelp,
  DollarSign,
  FolderOpen,
  Grid3X3,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Theater,
  X,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { useCartStore } from "@/stores/cart-store"
import { useMessageStore } from "@/features/messages/stores/message-store"
import { useMatrixStore } from "@/stores/matrix-store"
import { useUIStore } from "@/stores/ui-store"
import { cn, getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type BadgeType = "cart" | "messages" | "notifications"

interface NavItem {
  to: string
  label: string
  icon: typeof Grid3X3
  badge?: BadgeType
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: Grid3X3 },
  { to: "/catalogue", label: "Productions", icon: Theater },
  { to: "/my-resources", label: "Resources", icon: FolderOpen },
  { to: "/borrowing", label: "Borrowing", icon: ArrowLeftRight },
  { to: "/cart", label: "Finance", icon: DollarSign, badge: "cart" },
  { to: "/messages", label: "Messages", icon: MessageSquare, badge: "messages" },
  { to: "/notifications", label: "Alerts", icon: Bell, badge: "notifications" },
  { to: "/settings", label: "Settings", icon: Settings },
]

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
        "relative grid h-12 w-12 place-items-center rounded-[var(--dash-radius-sm)] border border-[color:var(--dash-border)] transition-all duration-150",
        active
          ? "bg-[var(--dash-accent-muted)] text-[var(--dash-text)]"
          : "bg-transparent text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface-raised)] hover:text-[var(--dash-text)]",
      )}
    >
      {children}
      {!!badge && badge > 0 && (
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-[color:var(--dash-bg-elevated)] bg-[var(--dash-accent)]" />
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
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

  function handleLogout() {
    logout()
    setSidebarOpen(false)
    navigate("/")
  }

  const profileInitials = user?.name ? getInitials(user.name) : "U"

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[rgba(8,8,16,0.8)] backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-[color:var(--dash-border)] bg-[var(--dash-surface-muted)] text-[var(--dash-text)] transition-all duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "w-20" : "w-72",
          "lg:translate-x-0",
        )}
      >
        {sidebarCollapsed ? (
          <div className="flex h-full w-20 flex-col items-center py-5">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              className="mb-8 grid h-12 w-12 place-items-center rounded-[var(--dash-radius-sm)] border border-[color:var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text-secondary)] transition-all duration-150 hover:bg-[var(--dash-surface-raised)] hover:text-[var(--dash-text)]"
              aria-label="Open sidebar"
            >
              <PanelLeftOpen className="h-5 w-5" strokeWidth={1.5} />
            </button>

            <nav className="flex flex-1 flex-col items-center gap-4">
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

            <div className="flex flex-col items-center gap-4">
              <RailItem
                to="/profile"
                active={isActive("/profile")}
                label="Profile"
                onClick={closeMobile}
              >
                <Avatar className="h-8 w-8 rounded-[var(--dash-radius-sm)]">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="rounded-[var(--dash-radius-sm)] bg-transparent text-xs font-medium text-current">
                    {profileInitials}
                  </AvatarFallback>
                </Avatar>
              </RailItem>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 pb-8 pt-6">
              <div className="mb-12 flex items-start justify-between gap-4">
                <NavLink to="/dashboard" onClick={closeMobile} className="block">
                  <span className="block text-[2rem] font-bold uppercase leading-none tracking-[0.08em] text-[var(--dash-text)]">
                    SKĒNĒ
                  </span>
                  <span className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--dash-text-muted)]">
                    System v.2.4
                  </span>
                </NavLink>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed(true)}
                    className="hidden h-9 w-9 place-items-center rounded-[var(--dash-radius-sm)] border border-[color:var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text-muted)] transition-all duration-150 hover:bg-[var(--dash-surface-raised)] hover:text-[var(--dash-text)] lg:grid"
                    aria-label="Collapse sidebar"
                  >
                    <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="grid h-9 w-9 place-items-center rounded-[var(--dash-radius-sm)] border border-[color:var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text-muted)] transition-all duration-150 hover:bg-[var(--dash-surface-raised)] hover:text-[var(--dash-text)] lg:hidden"
                    aria-label="Close sidebar"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <NavLink
                to="/my-resources"
                onClick={closeMobile}
                className="mb-10 flex min-h-12 items-center justify-center gap-2 rounded-[var(--dash-radius-sm)] border border-[color:var(--dash-accent)] bg-[var(--dash-accent-muted)] px-4 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--dash-accent)] transition-all duration-150 hover:bg-[var(--dash-accent)] hover:text-[var(--dash-bg)]"
              >
                New Production
                <Plus className="h-4 w-4" strokeWidth={2} />
              </NavLink>

              <nav className="space-y-1">
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
                        "group relative flex min-h-11 items-center gap-3 rounded-[var(--dash-radius-sm)] px-3 text-[0.8rem] font-medium uppercase tracking-[0.08em] transition-all duration-150",
                        active
                          ? "bg-[var(--dash-surface)] text-[var(--dash-text)]"
                          : "text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)]",
                      )}
                      title={item.label}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-[var(--dash-accent)]" />
                      )}
                      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            "grid h-5 min-w-5 place-items-center rounded-[var(--dash-radius-sm)] px-1 text-[10px] font-semibold",
                            active
                              ? "bg-[var(--dash-accent-muted)] text-[var(--dash-accent)]"
                              : "bg-[var(--dash-surface-raised)] text-[var(--dash-text-muted)] group-hover:bg-[var(--dash-accent-muted)] group-hover:text-[var(--dash-accent)]",
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </nav>
            </div>

            <div className="mt-auto px-6 pb-6">
              <div className="mb-5 border-t border-[color:var(--dash-border)] pt-5">
                <NavLink
                  to="/messages"
                  onClick={closeMobile}
                  className="flex min-h-10 items-center gap-3 rounded-[var(--dash-radius-sm)] px-2 text-xs font-medium uppercase tracking-[0.1em] text-[var(--dash-text-muted)] transition-all duration-150 hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)]"
                >
                  <CircleHelp className="h-4 w-4" strokeWidth={1.5} />
                  Support
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex min-h-10 w-full items-center gap-3 rounded-[var(--dash-radius-sm)] px-2 text-left text-xs font-medium uppercase tracking-[0.1em] text-[var(--dash-text-muted)] transition-all duration-150 hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)]"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
                  Logout
                </button>
              </div>

              <NavLink
                to="/profile"
                onClick={closeMobile}
                className="flex items-center gap-3 rounded-[var(--dash-radius-md)] border border-[color:var(--dash-border)] bg-[var(--dash-surface)] p-2 transition-all duration-150 hover:bg-[var(--dash-surface-raised)]"
              >
                <Avatar className="h-10 w-10 rounded-[var(--dash-radius-sm)] border border-[color:var(--dash-border)] bg-[var(--dash-surface-raised)]">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="rounded-[var(--dash-radius-sm)] bg-transparent text-xs font-medium text-current">
                    {profileInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold uppercase tracking-[0.04em] text-[var(--dash-text)]">
                    {user?.name ?? "Operator"}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--dash-text-muted)]">
                    Profile
                  </p>
                </div>
              </NavLink>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
