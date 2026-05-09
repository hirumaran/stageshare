import { Link } from "react-router-dom"
import { Bell, RefreshCw, UserRound } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { currentUser } from "@/data/mock-data"
import { getInitials } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"

export function TopBar() {
  const { user } = useAuthStore()
  const profile = user ?? currentUser

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-end gap-5 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/95 px-4 backdrop-blur md:px-8">
      <Link
        to="/notifications"
        aria-label="Notifications"
        className="text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)]"
      >
        <Bell className="h-4 w-4" strokeWidth={1} />
      </Link>
      <button
        type="button"
        aria-label="Refresh dashboard"
        className="cursor-pointer text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)]"
      >
        <RefreshCw className="h-4 w-4" strokeWidth={1} />
      </button>
      <Link to="/profile" aria-label="Profile" className="cursor-pointer">
        <Avatar className="h-7 w-7 rounded-full border border-[var(--border-default)] bg-[var(--bg-overlay)]">
          <AvatarImage src={profile.avatar} alt={profile.name} />
          <AvatarFallback className="rounded-full bg-[var(--bg-overlay)] font-mono text-[0.6rem] text-[var(--text-secondary)]">
            {profile.name ? (
              getInitials(profile.name)
            ) : (
              <UserRound className="h-3.5 w-3.5" />
            )}
          </AvatarFallback>
        </Avatar>
      </Link>
    </header>
  )
}
