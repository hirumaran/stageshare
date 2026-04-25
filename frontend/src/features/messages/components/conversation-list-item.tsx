import { Pin } from "lucide-react"
import { cn, relativeTimeShort } from "@/lib/utils"
import type { Conversation } from "../types"
import { getAvatarPalette, getInitials } from "../lib/avatar"

interface ConversationListItemProps {
  conversation: Conversation
  active?: boolean
  onClick: () => void
}

export function ConversationListItem({ conversation, active, onClick }: ConversationListItemProps) {
  const counterpart =
    conversation.participants.find((p) => p.id === conversation.counterpartId) ??
    conversation.participants[0]
  const presence = counterpart?.presence ?? "offline"
  const seed = counterpart?.id ?? conversation.id
  const palette = getAvatarPalette(seed)
  const initials = getInitials(counterpart?.name ?? conversation.title)

  const showPresence = presence === "online" || presence === "away"

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        "hover:bg-muted/60",
        active && "bg-muted",
      )}
    >
      {/* Active indicator bar */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-r-full bg-[var(--accent)] transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Avatar with deterministic palette */}
      <div className="relative shrink-0">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full font-mono text-[11px] font-semibold",
            palette.bg,
            palette.text,
          )}
        >
          {initials}
        </div>
        {showPresence ? (
          <span
            aria-label={`${presence}`}
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--bg-base)]",
              presence === "online" && "bg-emerald-500",
              presence === "away" && "bg-amber-500",
            )}
          />
        ) : null}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">{conversation.title}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            {conversation.pinned ? (
              <Pin
                className="h-3 w-3 -rotate-45 fill-muted-foreground/50 text-muted-foreground/70"
                aria-label="Pinned"
              />
            ) : null}
            <time className="text-[10px] tabular-nums text-muted-foreground">
              {relativeTimeShort(conversation.lastMessageAt)}
            </time>
          </div>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-xs",
              conversation.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {conversation.lastMessagePreview}
          </p>
          {conversation.unreadCount > 0 ? (
            <span
              aria-label={`${conversation.unreadCount} unread`}
              className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-medium text-[var(--accent-text)]"
            >
              {conversation.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}
