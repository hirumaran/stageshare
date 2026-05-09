import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion, type Variants } from "framer-motion"
import {
  ArrowLeftRight,
  Bell,
  ChevronsUpDown,
  DollarSign,
  Film,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Package,
  Plus,
  Settings,
  Theater,
  UserCircle,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CursorDrivenParticleTypography } from "@/components/ui/cursor-driven-particles-typography"
import { ScrollArea } from "@/components/ui/scroll-area"
import { currentUser } from "@/data/mock-data"
import { useMessageStore } from "@/features/messages/stores/message-store"
import { cn, getInitials } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { useCartStore } from "@/stores/cart-store"
import { useMatrixStore } from "@/stores/matrix-store"
import { useUIStore } from "@/stores/ui-store"

type BadgeType = "cart" | "messages" | "notifications"

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  badge?: BadgeType
}

const primaryNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/catalogue", label: "Productions", icon: Film },
  { to: "/my-resources", label: "Resources", icon: Package },
  { to: "/borrowing", label: "Borrowing", icon: ArrowLeftRight },
  { to: "/cart", label: "Finance", icon: DollarSign, badge: "cart" },
  { to: "/messages", label: "Messages", icon: MessageSquare, badge: "messages" },
  { to: "/notifications", label: "Alerts", icon: Bell, badge: "notifications" },
  { to: "/settings", label: "Settings", icon: Settings },
]

const sidebarVariants: Variants = {
  open: { width: "15rem" },
  closed: { width: "3.05rem" },
}

const labelVariants: Variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.16, ease: "easeOut" },
  },
  closed: {
    x: -8,
    opacity: 0,
    transition: { duration: 0.1, ease: "easeOut" },
  },
}

const staggerVariants: Variants = {
  open: {
    transition: { staggerChildren: 0.025, delayChildren: 0.02 },
  },
}

const transitionProps = {
  type: "tween" as const,
  ease: "easeOut" as const,
  duration: 0.2,
}

function isRouteActive(pathname: string, to: string) {
  return pathname === to || (to !== "/dashboard" && pathname.startsWith(to))
}

function CountBadge({ count, isCollapsed }: { count: number; isCollapsed: boolean }) {
  if (count <= 0) return null

  return (
    <Badge
      className={cn(
        "ml-auto grid h-5 min-w-5 place-items-center rounded-full border-transparent bg-primary px-1.5 font-mono text-[0.65rem] leading-none text-primary-foreground",
        isCollapsed && "absolute right-1.5 top-1 h-2.5 min-w-2.5 p-0 text-[0px]",
      )}
    >
      {count}
    </Badge>
  )
}

export function SessionNavBar() {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { unreadNotificationCount } = useUIStore()
  const mockTotalUnread = useMessageStore((state) => state.totalUnread())
  const matrixUnread = useMatrixStore((state) => state.getUnreadCount())
  const matrixReady = useMatrixStore((state) => state.isReady)
  const cartCount = useCartStore((state) => state.getItemCount())
  const profile = user ?? currentUser
  const profileInitials = getInitials(profile.name)

  function getBadge(type?: BadgeType) {
    if (type === "cart") return cartCount
    if (type === "messages") return matrixReady ? matrixUnread : mockTotalUnread
    if (type === "notifications") return unreadNotificationCount
    return 0
  }

  function handleLogout() {
    logout()
    setIsProfileOpen(false)
    navigate("/")
  }

  useEffect(() => {
    if (!isProfileOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsProfileOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isProfileOpen])

  return (
    <>
      <motion.aside
        className="fixed inset-y-0 left-0 z-40 hidden shrink-0 overflow-visible border-r border-border bg-sidebar text-sidebar-foreground shadow-md md:block"
        initial={isCollapsed ? "closed" : "open"}
        animate={isCollapsed ? "closed" : "open"}
        variants={sidebarVariants}
        transition={transitionProps}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => {
          setIsCollapsed(true)
        }}
      >
        <div className="flex h-full flex-col justify-between">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-center border-b border-sidebar-border px-4 pt-6 pb-8">
              <div
                className={cn(
                  "flex items-center rounded-lg text-sidebar-foreground",
                  isCollapsed ? "h-12 w-12 justify-center" : "h-14 w-[12.25rem] justify-center",
                )}
                aria-label="Skene"
              >
                {isCollapsed ? (
                  <motion.div
                    key="collapsed-logo-icon"
                    className="grid h-10 w-10 place-items-center rounded-xl text-primary"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Theater className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="particle-logo"
                    className="h-14 w-[11.75rem] overflow-hidden"
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <CursorDrivenParticleTypography
                      text="SKENE"
                      fontSize={48}
                      fontFamily="'DM Sans', 'Inter', system-ui, sans-serif"
                      color="#e2e8f0"
                      particleDensity={4}
                      particleSize={2.5}
                      dispersionStrength={0}
                      returnSpeed={0.12}
                      interactive={false}
                      ambientMotion={false}
                    />
                  </motion.div>
                )}
              </div>
            </div>

            <div className={cn("mb-6 flex justify-center", isCollapsed ? "px-2" : "px-4")}>
              <Button
                asChild
                variant="outline"
                size="sm"
                className={cn(
                  "h-11 cursor-pointer rounded-lg border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
                  isCollapsed
                    ? "w-full justify-center px-0"
                    : "w-[12rem] justify-start gap-3 px-3",
                )}
              >
                <Link to="/my-resources" aria-label="Create new production">
                  <Plus className="h-4 w-4" />
                  {!isCollapsed && (
                    <motion.span variants={labelVariants}>
                      <span className="text-sm font-medium">New Production</span>
                    </motion.span>
                  )}
                </Link>
              </Button>
            </div>

            <ScrollArea className={cn("min-h-0 flex-1", isCollapsed ? "px-2" : "px-4")}>
              <motion.nav
                variants={staggerVariants}
                className={cn(
                  "mx-auto flex w-full flex-col",
                  isCollapsed ? "max-w-none" : "max-w-[12rem]",
                )}
              >
                {primaryNav.map((item) => (
                  <DesktopNavItem
                    key={item.to}
                    item={item}
                    active={isRouteActive(pathname, item.to)}
                    count={getBadge(item.badge)}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </motion.nav>
            </ScrollArea>
          </div>

          <div
            className={cn(
              "mt-auto shrink-0 border-t border-sidebar-border pb-4",
              isCollapsed ? "px-2 pt-2" : "px-4 pt-4",
            )}
          >
            <DesktopUtilityItem
              to="/messages"
              icon={LifeBuoy}
              label="Support"
              active={pathname.startsWith("/support")}
              isCollapsed={isCollapsed}
            />

            <div
              className={cn("relative mx-auto w-full", isCollapsed ? "max-w-none" : "max-w-[12rem]")}
              ref={profileMenuRef}
            >
              {isProfileOpen && (
                <div
                  className="absolute bottom-11 left-0 z-50 w-64 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-lg"
                  role="menu"
                >
                  <div className="flex items-center gap-3 p-2">
                    <Avatar className="size-8">
                      <AvatarImage src={profile.avatar} alt={profile.name} />
                      <AvatarFallback className="font-mono text-xs">
                        {profileInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-medium">
                        {profile.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                  <div className="my-1 h-px bg-muted" />
                  <Link
                    to="/profile"
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <UserCircle className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <div className="my-1 h-px bg-muted" />
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}

              <Button
                type="button"
                variant="ghost"
                className={cn(
                  "mt-1 h-10 w-full cursor-pointer justify-start rounded-full py-0 pl-0 pr-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed
                    ? "justify-center rounded-lg p-0"
                    : "h-12 gap-3 pl-1.5 pr-3",
                )}
                aria-expanded={isProfileOpen}
                aria-label="Open account menu"
                onClick={() => setIsProfileOpen((open) => !open)}
              >
                <span className="flex aspect-square h-full p-1.5">
                  <Avatar className="h-full w-full rounded-full">
                    <AvatarImage src={profile.avatar} alt={profile.name} />
                    <AvatarFallback className="font-mono text-[0.6rem]">
                      {profileInitials}
                    </AvatarFallback>
                  </Avatar>
                </span>
                {!isCollapsed && (
                  <motion.span
                    variants={labelVariants}
                    className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden"
                  >
                    <span className="truncate text-sm font-medium">{profile.name}</span>
                    <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
                  </motion.span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.aside>

      <MobileNav pathname={pathname} getBadge={getBadge} />
    </>
  )
}

interface DesktopNavItemProps {
  item: NavItem
  active: boolean
  count: number
  isCollapsed: boolean
}

function DesktopNavItem({ item, active, count, isCollapsed }: DesktopNavItemProps) {
  const Icon = item.icon

  return (
    <Link
      to={item.to}
      aria-label={item.label}
      className={cn(
        "relative mb-0.5 flex h-11 cursor-pointer items-center rounded-lg py-2.5 text-sm leading-6 transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        active && "bg-primary/10 text-primary",
        isCollapsed
          ? "justify-center gap-0 px-0"
          : "justify-start gap-3 px-3",
      )}
    >
      <Icon className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-[1.15rem] w-[1.15rem]")} aria-hidden="true" />
      {!isCollapsed && (
        <motion.span
          variants={labelVariants}
          className="flex min-w-0 flex-1 items-center overflow-hidden"
        >
          <>
            <span className="truncate font-medium">{item.label}</span>
            <CountBadge count={count} isCollapsed={false} />
          </>
        </motion.span>
      )}
      {isCollapsed && <CountBadge count={count} isCollapsed />}
    </Link>
  )
}

interface DesktopUtilityItemProps {
  to: string
  icon: typeof LifeBuoy
  label: string
  active: boolean
  isCollapsed: boolean
}

function DesktopUtilityItem({
  to,
  icon: Icon,
  label,
  active,
  isCollapsed,
}: DesktopUtilityItemProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        "mb-0.5 flex h-11 cursor-pointer items-center rounded-lg py-2.5 text-sm leading-6 transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        active && "bg-primary/10 text-primary",
        isCollapsed
          ? "justify-center gap-0 px-0"
          : "justify-start gap-3 px-3",
      )}
    >
      <Icon className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-[1.15rem] w-[1.15rem]")} aria-hidden="true" />
      {!isCollapsed && (
        <motion.span variants={labelVariants}>
          <span className="font-medium">{label}</span>
        </motion.span>
      )}
    </Link>
  )
}

interface MobileNavProps {
  pathname: string
  getBadge: (type?: BadgeType) => number
}

function MobileNav({ pathname, getBadge }: MobileNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center overflow-x-auto border-t border-sidebar-border bg-sidebar px-2 text-sidebar-foreground md:hidden">
      {primaryNav.map((item) => {
        const active = isRouteActive(pathname, item.to)
        const count = getBadge(item.badge)
        const Icon = item.icon

        return (
          <Link
            key={item.to}
            to={item.to}
            aria-label={item.label}
            className={cn(
              "relative grid min-w-14 flex-1 cursor-pointer place-items-center rounded-lg p-2 transition-colors duration-200 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
