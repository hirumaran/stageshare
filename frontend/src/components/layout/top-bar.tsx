import { Link } from "react-router-dom"
import { Bell } from "lucide-react"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { useScroll } from "@/components/ui/use-scroll"
import { cn } from "@/lib/utils"

export function TopBar() {
  const scrolled = useScroll(10)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end px-4 transition-colors duration-200 md:px-8">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-b transition-colors duration-200 [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]",
          scrolled
            ? "from-[var(--bg-base)]/85 via-[var(--bg-base)]/45 to-[var(--bg-base)]/0 backdrop-blur-lg supports-[backdrop-filter]:from-[var(--bg-base)]/70"
            : "from-transparent via-transparent to-transparent",
        )}
        aria-hidden="true"
      />
      <div className="relative z-10 flex items-center justify-end gap-3">
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Bell className="h-4 w-4" strokeWidth={1} />
        </Link>
        <AnimatedThemeToggler className="h-9 w-9 text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-primary [&_svg]:h-4 [&_svg]:w-4" />
      </div>
    </header>
  )
}
