import { motion } from "framer-motion"
import { Check, CheckCheck, CircleAlert, Clock } from "lucide-react"
import { cn, formatChatTime } from "@/lib/utils"
import type { Message } from "../types"
import { getAvatarPalette, getInitials } from "../lib/avatar"

interface MessageBubbleProps {
  message: Message
  mine: boolean
  isTail: boolean
  isHead: boolean
  avatarInfo: { initials: string; palette: ReturnType<typeof getAvatarPalette> } | null
}

function StatusIcon({ message }: { message: Message }) {
  switch (message.status) {
    case "sending":
      return <Clock className="h-3 w-3 animate-spin opacity-60" aria-label="Sending" />
    case "sent":
      return <Check className="h-3 w-3 opacity-70" aria-label="Sent" />
    case "delivered":
      return <CheckCheck className="h-3 w-3 opacity-70" aria-label="Delivered" />
    case "read":
      return <CheckCheck className="h-3 w-3 text-[var(--accent)]" aria-label="Read" />
    case "failed":
      return <CircleAlert className="h-3 w-3 text-red-500" aria-label="Failed" />
    default:
      return null
  }
}

export function MessageBubble({ message, mine, isHead, isTail, avatarInfo }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex w-full", mine ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "group flex max-w-[85%] gap-3",
          mine ? "flex-row-reverse" : "flex-row",
        )}
      >
        {/* Avatar for received messages — only on head */}
        {!mine && avatarInfo && isHead ? (
          <div className="mt-auto shrink-0">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-semibold",
                avatarInfo.palette.bg,
                avatarInfo.palette.text,
              )}
            >
              {avatarInfo.initials}
            </div>
          </div>
        ) : !mine ? (
          <div className="w-7 shrink-0" aria-hidden="true" />
        ) : null}

        <div className={cn("flex flex-col gap-0.5", mine ? "items-end" : "items-start")}>
          <div
            className={cn(
              "relative px-4 py-2.5 text-[15px] leading-[1.5] shadow-sm",
              mine
                ? "bg-[var(--accent)] text-[var(--accent-text)]"
                : "bg-[var(--bg-muted)] text-foreground",
              // Smooth radii: pill-like when single, tighter when grouped
              "rounded-[18px]",
              mine && !isHead && "rounded-tr-[6px]",
              mine && !isTail && "rounded-br-[6px]",
              !mine && !isHead && "rounded-tl-[6px]",
              !mine && !isTail && "rounded-bl-[6px]",
              message.pending && "opacity-70",
            )}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>

          {isTail ? (
            <div
              className={cn(
                "flex items-center gap-1.5 px-1 text-[11px] tabular-nums",
                mine ? "text-muted-foreground/50" : "text-muted-foreground/50",
              )}
            >
              <span>{formatChatTime(message.sentAt)}</span>
              {mine && (
                <span className="flex items-center">
                  <StatusIcon message={message} />
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}
