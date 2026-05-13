import { Edit3 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ProfileCardProps {
  name?: string
  handle?: string
  timestamp?: string
  imageSrc?: string
  avatarSrc?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

const defaultImage =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"

export const ProfileCard = ({
  name = "John Doe",
  handle = "@johndoe",
  timestamp = "12m ago",
  imageSrc = defaultImage,
  avatarSrc = imageSrc,
  actionLabel = "Edit profile",
  onAction,
  className,
}: ProfileCardProps) => {
  return (
    <div className={cn("w-full max-w-sm", className)}>
      <div className="group overflow-hidden rounded-2xl border border-black/10 bg-white/85 shadow-[0_18px_50px_rgba(25,20,15,0.14)] backdrop-blur-xl transition-colors duration-200 hover:border-black/15 dark:border-white/[0.10] dark:bg-[#25211d]/90 dark:shadow-[0_18px_50px_rgba(0,0,0,0.24)] dark:hover:border-white/[0.16]">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={imageSrc}
            alt={name}
            className="h-full w-full object-cover brightness-[0.94] saturate-[0.92] transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <p className="absolute bottom-4 left-4 font-serif text-2xl text-white drop-shadow">
            {name}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/45 dark:ring-white/15">
              <img
                src={avatarSrc}
                alt={`${name} avatar`}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {handle}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {timestamp}
              </p>
            </div>
          </div>

          <button
            onClick={onAction}
            className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-secondary px-3.5 text-xs font-medium text-foreground transition-colors duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
            aria-label={actionLabel}
          >
            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{actionLabel}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export const Component = ProfileCard

export default Component
