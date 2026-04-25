"use client"

import { useEffect, useRef } from "react"
import { motion } from "motion/react"
import { DateSeparator } from "./date-separator"
import { MessageBubble } from "./message-bubble"
import type { MessageGroup } from "../hooks/use-messages"
import type { Conversation } from "../types"
import { currentUser } from "../lib/seed-data"

interface ChatThreadProps {
  conversation: Conversation
  groups: MessageGroup[]
  typingUserName?: string | null
}

export function ChatThread({ conversation, groups, typingUserName }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when groups update or typing changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [groups, typingUserName])

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
      aria-live="polite"
      aria-label={`Messages in ${conversation.title}`}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        {groups.map((group) => (
          <section key={group.dayKey} className="flex flex-col gap-2">
            <DateSeparator label={group.label} />
            {group.messages.map((message, idx) => {
              const prev = group.messages[idx - 1]
              const next = group.messages[idx + 1]
              const isHead = !prev || prev.authorId !== message.authorId
              const isTail = !next || next.authorId !== message.authorId
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  mine={message.authorId === currentUser.id}
                  isHead={isHead}
                  isTail={isTail}
                />
              )
            })}
          </section>
        ))}

        {typingUserName ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 pl-1 pt-1"
            aria-label={`${typingUserName} is typing`}
          >
            <div className="flex items-center gap-1 rounded-2xl border border-border bg-background px-3 py-2">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              {typingUserName} is typing…
            </p>
          </motion.div>
        ) : null}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
