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
  avatarInfo: {
    name: string
    initials: string
    palette: ReturnType<typeof getAvatarPalette>
  } | null
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
      return <CheckCheck className="h-3 w-3 text-black" aria-label="Read" />
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
          "group flex max-w-[92%] gap-3 sm:max-w-[82%] xl:max-w-[72%]",
          mine ? "flex-row-reverse" : "flex-row",
        )}
      >
        {!mine && avatarInfo && isHead ? (
          <div className="shrink-0 self-start pt-7">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center border-2 border-black text-[0.68rem] font-black shadow-[3px_3px_0_#000]",
                avatarInfo.palette.bg,
                avatarInfo.palette.text,
              )}
            >
              {avatarInfo.initials}
            </div>
          </div>
        ) : !mine ? (
          <div className="w-9 shrink-0" aria-hidden="true" />
        ) : null}

        <div className={cn("flex flex-col gap-1.5", mine ? "items-end" : "items-start")}>
          {isHead ? (
            <div
              className={cn(
                "flex items-center gap-2 px-1 text-[0.7rem] font-black uppercase tracking-[0.18em]",
                mine ? "justify-end text-black" : "justify-start text-black/70",
              )}
            >
              <span>{mine ? "You" : (avatarInfo?.name ?? "Teammate")}</span>
              {!mine && <span className="h-2 w-2 bg-[#ffc425]" aria-hidden="true" />}
            </div>
          ) : null}

          <div
            className={cn(
              "relative border-[3px] px-5 py-4 text-[1rem] leading-relaxed shadow-[6px_6px_0_#000]",
              mine
                ? "border-black bg-[#ffc425] text-black"
                : "border-black bg-[#fbfaf7] text-black",
              "rounded-[6px]",
              mine && !isHead && "rounded-tr-none",
              mine && !isTail && "rounded-br-none",
              !mine && !isHead && "rounded-tl-none",
              !mine && !isTail && "rounded-bl-none",
              message.pending && "opacity-70",
            )}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>

          {isTail ? (
            <div
              className={cn(
                "flex items-center gap-1.5 px-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-black/55 tabular-nums",
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
