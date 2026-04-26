import { ArrowLeft, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Conversation } from "../types"
import { getAvatarPalette, getInitials } from "../lib/avatar"

interface ChatHeaderProps {
  conversation: Conversation
  onBack?: () => void
}

export function ChatHeader({ conversation, onBack }: ChatHeaderProps) {
  const counterpart =
    conversation.participants.find((p) => p.id === conversation.counterpartId) ??
    conversation.participants[0]
  const presence = counterpart?.presence ?? "offline"
  const palette = getAvatarPalette(counterpart?.id ?? conversation.id)
  const initials = getInitials(counterpart?.name ?? conversation.title)

  const presenceConfig =
    presence === "online"
      ? { label: "Active now", dot: "bg-emerald-500" }
      : presence === "away"
        ? { label: "Away", dot: "bg-amber-500" }
        : { label: "Offline", dot: "bg-gray-500" }

  return (
    <header className="flex items-center gap-3 border-b border-border/20 bg-[var(--bg-base)] px-4 py-3">
      {/* Mobile back button */}
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 shrink-0 rounded-full p-2 text-[var(--accent)] transition-colors hover:bg-[var(--bg-muted)]/50 md:hidden"
          aria-label="Back to conversations"
          title="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : null}

      {/* Identity */}
      <div className="flex flex-1 items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold",
            palette.bg,
            palette.text,
          )}
        >
          {initials}
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-[14px] font-semibold leading-tight text-foreground">
            {conversation.title}
          </p>
          <div className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", presenceConfig.dot)} />
            <p className="text-[12px] leading-tight text-muted-foreground/70">
              {presenceConfig.label}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          className="rounded-full p-2 text-muted-foreground/70 transition-colors hover:bg-[var(--bg-muted)]/50 hover:text-[var(--accent)]"
          aria-label="Details"
          title="Details"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
