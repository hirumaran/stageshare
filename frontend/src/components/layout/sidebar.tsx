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
        "relative grid h-12 w-12 place-items-center border-2 border-black transition-colors",
        active ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white",
      )}
    >
      {children}
      {!!badge && badge > 0 && (
        <span className="absolute -right-1 -top-1 h-3 w-3 border-2 border-white bg-[#ffc425]" />
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
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r-[5px] border-black bg-[#fbfaf7] text-black transition-all duration-300 ease-in-out",
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
              className="mb-8 grid h-12 w-12 place-items-center border-2 border-black bg-black text-white transition-colors hover:bg-white hover:text-black"
              aria-label="Open sidebar"
            >
              <PanelLeftOpen className="h-5 w-5" />
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
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
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
                <Avatar className="h-8 w-8 rounded-none">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="rounded-none bg-transparent text-xs font-black text-current">
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
                  <span className="block text-[2rem] font-black uppercase leading-none tracking-[-0.12em]">
                    SKĒNĒ
                  </span>
                  <span className="mt-4 block text-sm font-medium uppercase tracking-[0.08em] text-black/80">
                    System v.2.4
                  </span>
                </NavLink>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed(true)}
                    className="hidden h-9 w-9 place-items-center border-2 border-black bg-white transition-colors hover:bg-black hover:text-white lg:grid"
                    aria-label="Collapse sidebar"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="grid h-9 w-9 place-items-center border-2 border-black bg-white transition-colors hover:bg-black hover:text-white lg:hidden"
                    aria-label="Close sidebar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <NavLink
                to="/my-resources"
                onClick={closeMobile}
                className="mb-9 flex min-h-14 items-center justify-between bg-black px-5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-[4px_4px_0_#000] transition-transform hover:-translate-y-0.5"
              >
                New Production
                <Plus className="h-7 w-7" />
              </NavLink>

              <nav className="space-y-2.5">
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
                        "group flex min-h-12 items-center gap-4 px-4 text-[0.95rem] font-black uppercase tracking-[-0.05em] transition-colors",
                        active ? "bg-black text-white" : "text-black/62 hover:bg-black hover:text-white",
                      )}
                      title={item.label}
                    >
                      <Icon className="h-6 w-6 shrink-0" strokeWidth={2.2} />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            "grid h-7 min-w-7 place-items-center px-1.5 text-xs font-black",
                            active ? "bg-white text-black" : "bg-black text-white group-hover:bg-white group-hover:text-black",
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
              <div className="mb-5 border-t-[3px] border-black pt-5">
                <NavLink
                  to="/messages"
                  onClick={closeMobile}
                  className="flex min-h-11 items-center gap-4 text-sm font-medium uppercase tracking-[0.12em] text-black/70 transition-colors hover:text-black"
                >
                  <CircleHelp className="h-4 w-4" />
                  Support
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-3 flex min-h-11 w-full items-center gap-4 text-left text-sm font-medium uppercase tracking-[0.12em] text-black/70 transition-colors hover:text-black"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>

              <NavLink
                to="/profile"
                onClick={closeMobile}
                className="flex items-center gap-3 border-2 border-black p-2 transition-colors hover:bg-black hover:text-white"
              >
                <Avatar className="h-10 w-10 rounded-none border-2 border-current bg-[#d8d8d4]">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="rounded-none bg-transparent text-xs font-black text-current">
                    {profileInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black uppercase tracking-[-0.04em]">
                    {user?.name ?? "Operator"}
                  </p>
                  <p className="text-xs uppercase tracking-[0.1em] opacity-70">
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
