"use client"

import { motion } from "motion/react"
import { Check, CheckCheck, CircleAlert, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Message } from "../types"

interface MessageBubbleProps {
  message: Message
  mine: boolean
  /** Whether this is the last message in a consecutive sequence from the same author */
  isTail: boolean
  /** Whether this is the first message in a consecutive sequence */
  isHead: boolean
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

function StatusIcon({ message }: { message: Message }) {
  switch (message.status) {
    case "sending":
      return <Clock className="h-3 w-3 opacity-60" aria-label="Sending" />
    case "sent":
      return <Check className="h-3 w-3 opacity-70" aria-label="Sent" />
    case "delivered":
      return <CheckCheck className="h-3 w-3 opacity-70" aria-label="Delivered" />
    case "read":
      return <CheckCheck className="h-3 w-3 text-emerald-500" aria-label="Read" />
    case "failed":
      return <CircleAlert className="h-3 w-3 text-red-500" aria-label="Failed" />
    default:
      return null
  }
}

export function MessageBubble({ message, mine, isTail, isHead }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={cn("flex w-full", mine ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "group flex max-w-[78%] flex-col gap-1 sm:max-w-[68%]",
          mine ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            // Equal padding on both bubble variants
            "relative rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed",
            mine
              ? // Sent: deep neutral with crisp white text, subtle inset highlight so it
                // reads as an intentional bubble (not a censor bar) and a soft drop shadow.
                "bg-foreground text-background shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_1px_2px_0_rgba(0,0,0,0.08)]"
              : // Received: tinted neutral surface — clearly differentiated from white
                // page background, no border so the form reads as a soft cushion.
                "bg-secondary text-foreground",
            // Tighter corners on the "tail" side for grouped sequences
            mine && !isHead && "rounded-tr-md",
            mine && !isTail && "rounded-br-md",
            !mine && !isHead && "rounded-tl-md",
            !mine && !isTail && "rounded-bl-md",
            message.pending && "opacity-70",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        </div>

        {isTail ? (
          <div
            className={cn(
              "flex items-center gap-1.5 px-1 font-mono text-[10px] tabular-nums text-muted-foreground",
              mine ? "flex-row-reverse" : "flex-row",
            )}
          >
            <span>{timeOf(message.createdAt)}</span>
            {mine ? (
              <span className="flex items-center" aria-live="polite">
                <StatusIcon message={message} />
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
