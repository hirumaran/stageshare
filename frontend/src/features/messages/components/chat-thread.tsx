import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { DateSeparator } from "./date-separator"
import { MessageBubble } from "./message-bubble"
import type { MessageGroup } from "../hooks/use-messages"
import type { Conversation } from "../types"
import { appCurrentUser } from "../lib/seed-data"

interface ChatThreadProps {
  conversation: Conversation
  groups: MessageGroup[]
  typingUserName?: string | null
}

export function ChatThread({ conversation, groups, typingUserName }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [groups, typingUserName])

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto px-4 pb-2 pt-6 sm:px-6"
      aria-live="polite"
      aria-label={`Messages in ${conversation.title}`}
    >
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end">
        {groups.map((group) => (
          <section key={group.dayKey} className="flex flex-col">
            <DateSeparator label={group.label} />
            {group.messages.map((message, idx) => {
              const prev = group.messages[idx - 1]
              const next = group.messages[idx + 1]
              const isHead = !prev || prev.senderId !== message.senderId
              const isTail = !next || next.senderId !== message.senderId
              return (
                <div key={message.id} className={isHead ? "mt-3" : "mt-0.5"}>
                  <MessageBubble
                    message={message}
                    mine={message.senderId === appCurrentUser.id}
                    isHead={isHead}
                    isTail={isTail}
                  />
                </div>
              )
            })}
          </section>
        ))}

        {typingUserName ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-3 flex items-center gap-2 pl-1"
            aria-label={`${typingUserName} is typing`}
          >
            <div className="flex items-center gap-1 rounded-2xl border border-border/40 bg-[var(--bg-subtle)] px-3 py-2">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              {typingUserName} is typing…
            </p>
          </motion.div>
        ) : null}

        <div ref={bottomRef} className="h-1 shrink-0" />
      </div>
    </div>
  )
}
