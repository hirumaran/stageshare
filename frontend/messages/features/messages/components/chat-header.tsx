"use client"

import { ArrowLeft, MoreHorizontal, Phone, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Conversation } from "../types"
import { getAvatarPalette, getInitials } from "../lib/avatar"

interface ChatHeaderProps {
  conversation: Conversation
  onBack?: () => void
}

export function ChatHeader({ conversation, onBack }: ChatHeaderProps) {
  const counterpart = conversation.participants[0]
  const presence = counterpart?.presence ?? "offline"
  const presenceLabel =
    presence === "online" ? "Active now" : presence === "away" ? "Away" : "Offline"
  const palette = getAvatarPalette(counterpart?.id ?? conversation.id)
  const initials = getInitials(counterpart?.name ?? conversation.title)
  const showPresence = presence === "online" || presence === "away"

  return (
    <header className="flex items-center gap-3 border-b border-border bg-background px-4 py-3.5 sm:px-5 sm:py-4">
      {/* Mobile back button */}
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      ) : null}

      {/* Identity — left aligned with breathing room */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
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
              aria-hidden="true"
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background",
                presence === "online" && "bg-emerald-500",
                presence === "away" && "bg-amber-500",
              )}
            />
          ) : null}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-foreground">{conversation.title}</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-[11px] text-muted-foreground">
            <span className="truncate">@{counterpart?.handle ?? "unknown"}</span>
            <span aria-hidden="true">·</span>
            <span
              className={cn(
                "truncate",
                presence === "online" && "text-emerald-600",
                presence === "away" && "text-amber-600",
              )}
            >
              {presenceLabel}
            </span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Voice call"
          title="Voice call"
        >
          <Phone className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="hidden rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:block"
          aria-label="Video call"
          title="Video call"
        >
          <Video className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="More options"
          title="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
