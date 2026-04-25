import { motion } from "framer-motion"
import { Check, CheckCheck, CircleAlert, Clock } from "lucide-react"
import { cn, formatChatTime } from "@/lib/utils"
import type { Message } from "../types"

interface MessageBubbleProps {
  message: Message
  mine: boolean
  /** Whether this is the last message in a consecutive sequence from the same author */
  isTail: boolean
  /** Whether this is the first message in a consecutive sequence */
  isHead: boolean
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
      return <CheckCheck className="h-3 w-3 text-blue-500" aria-label="Read" />
    case "failed":
      return <CircleAlert className="h-3 w-3 text-red-500" aria-label="Failed" />
    default:
      return null
  }
}

export function MessageBubble({ message, mine, isHead, isTail }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.975 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex w-full", mine ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "group relative flex max-w-[80%] flex-col gap-0.5 sm:max-w-[65%]",
          mine ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed shadow-sm",
            mine
              ? "bg-[var(--accent)] text-black"
              : "border border-border/20 bg-zinc-800 text-zinc-50",
            // Grouped corner radius — tighter on the "tail" side for stacks
            mine && !isHead && "rounded-tr-md",
            mine && !isTail && "rounded-br-md",
            !mine && !isHead && "rounded-tl-md",
            !mine && !isTail && "rounded-bl-md",
            message.pending && "opacity-60",
          )}
        >
          {/* Tail notch */}
          {isHead && mine && (
            <div className="absolute -right-[4px] bottom-0 h-3 w-3 rotate-45 rounded-[1px] bg-[var(--accent)]" />
          )}
          {isHead && !mine && (
            <div className="absolute -left-[4px] bottom-0 h-3 w-3 rotate-45 rounded-[1px] bg-zinc-800" />
          )}

          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {isTail ? (
          <div className="flex items-center gap-1.5 px-1 text-[10px] tabular-nums text-muted-foreground">
            <span>{formatChatTime(message.sentAt)}</span>
            {mine && (
              <span className="flex items-center">
                <StatusIcon message={message} />
              </span>
            )}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
