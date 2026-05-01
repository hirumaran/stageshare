import { Box, Pin } from "lucide-react"
import { cn, relativeTimeShort } from "@/lib/utils"
import type { Conversation } from "../types"
import { getAvatarPalette, getInitials } from "../lib/avatar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ConversationListItemProps {
  conversation: Conversation
  active?: boolean
  onClick: () => void
}

export function ConversationListItem({ conversation, active, onClick }: ConversationListItemProps) {
  const counterpart =
    conversation.participants.find((p) => p.id === conversation.counterpartId) ??
    conversation.participants[0]
  const seed = counterpart?.id ?? conversation.id
  const palette = getAvatarPalette(seed)
  const initials = getInitials(counterpart?.name ?? conversation.title)

  const isUnread = conversation.unreadCount > 0
  const presence = counterpart?.presence ?? "offline"
  const presenceClass =
    presence === "online"
      ? "bg-[#35c76f]"
      : presence === "away"
        ? "bg-[#ffc425]"
        : "bg-[#9a9a9a]"

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "group relative flex w-full items-stretch gap-3 border-b-[3px] border-black px-4 py-4 text-left transition-colors",
        active
          ? "bg-black text-white"
          : "bg-[#fbfaf7] text-black hover:bg-[#fff3c4]",
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-14 w-14 rounded-none border-[3px] border-current bg-white">
          <AvatarImage
            src={counterpart?.avatar}
            alt={counterpart?.name ?? conversation.title}
            className="object-cover grayscale"
          />
          <AvatarFallback
            className={cn(
              "rounded-none text-sm font-black",
              active ? "bg-white text-black" : `${palette.bg} ${palette.text}`,
            )}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute -bottom-1 -right-1 h-4 w-4 border-2 border-current",
            presenceClass,
          )}
          aria-label={`${presence} status`}
        />
      </div>

      <div className="min-w-0 flex-1 self-center">
        <div className="mb-1 flex items-start justify-between gap-3">
          <p
            className={cn(
              "truncate text-base font-black leading-tight",
              active ? "text-white" : "text-black",
            )}
          >
            {conversation.title}
          </p>
          <time
            className={cn(
              "shrink-0 border-2 px-1.5 py-0.5 text-[0.66rem] font-black uppercase tabular-nums",
              active ? "border-white text-white" : "border-black text-black",
            )}
          >
            {relativeTimeShort(conversation.lastMessageAt)}
          </time>
        </div>

        {conversation.resource ? (
          <div
            className={cn(
              "mb-2 inline-flex max-w-full items-center gap-1.5 border-2 px-2 py-1 text-[0.62rem] font-black uppercase",
              active ? "border-white bg-white text-black" : "border-black bg-[#e9e6dc] text-black",
            )}
          >
            <Box className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{conversation.resource.title}</span>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <p
            className={cn(
              "truncate text-sm leading-snug",
              active
                ? "text-white/80"
                : isUnread
                  ? "font-black text-black"
                  : "text-black/62",
            )}
          >
            {conversation.lastMessagePreview}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {isUnread && (
              <span
                className={cn(
                  "grid h-7 min-w-7 place-items-center border-2 px-1 text-xs font-black",
                  active ? "border-white bg-[#ffc425] text-black" : "border-black bg-black text-white",
                )}
              >
                {conversation.unreadCount}
              </span>
            )}
            {conversation.pinned && (
              <Pin
                className={cn(
                  "h-4 w-4 -rotate-45",
                  active ? "text-[#ffc425]" : "text-black/55",
                )}
                aria-label="Pinned"
              />
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
