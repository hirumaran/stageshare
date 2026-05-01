import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { DateSeparator } from "./date-separator"
import { MessageBubble } from "./message-bubble"
import type { MessageGroup } from "../hooks/use-messages"
import type { Conversation } from "../types"
import { appCurrentUser } from "../lib/seed-data"
import { getAvatarPalette, getInitials } from "../lib/avatar"
import { useAuthStore } from "@/stores/auth-store"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ChatThreadProps {
  conversation: Conversation
  groups: MessageGroup[]
  typingUserName?: string | null
}

export function ChatThread({ conversation, groups, typingUserName }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const myMatrixId = useAuthStore((s) => s.user?.matrixUserId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [groups, typingUserName])

  return (
    <ScrollArea className="relative min-h-0 flex-1 bg-[#f4f1ea] px-4 pb-6 pt-2 md:px-8 lg:px-12 xl:px-16">
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#000_1.2px,transparent_1.2px)] [background-size:18px_18px]" />
      <div className="relative mx-auto flex min-h-full w-full max-w-[1180px] flex-col justify-end">
        {groups.map((group) => (
          <section key={group.dayKey} className="flex flex-col">
            <DateSeparator label={group.label} />
            {group.messages.map((message, idx) => {
              const prev = group.messages[idx - 1]
              const next = group.messages[idx + 1]
              const isHead = !prev || prev.senderId !== message.senderId
              const isTail = !next || next.senderId !== message.senderId
              const mine = message.senderId === (myMatrixId ?? appCurrentUser.id)

              // Avatar info for received messages
              let avatarInfo: {
                name: string
                initials: string
                palette: ReturnType<typeof getAvatarPalette>
              } | null = null
              if (!mine) {
                const sender = conversation.participants.find((p) => p.id === message.senderId)
                if (sender) {
                  avatarInfo = {
                    name: sender.name,
                    initials: getInitials(sender.name),
                    palette: getAvatarPalette(sender.id),
                  }
                }
              }

              return (
                <div key={message.id} className={isHead ? "mt-4" : "mt-0.5"}>
                  <MessageBubble
                    message={message}
                    mine={mine}
                    isHead={isHead}
                    isTail={isTail}
                    avatarInfo={avatarInfo}
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
            className="mt-6 flex items-center gap-3 pl-1"
            aria-label={`${typingUserName} is typing`}
          >
            <div className="grid h-9 w-9 place-items-center border-2 border-black bg-white text-[0.62rem] font-black">
              {typingUserName
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="flex items-center gap-1 border-[3px] border-black bg-white px-4 py-3 shadow-[4px_4px_0_#000]">
              <span className="h-2 w-2 animate-bounce bg-black [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce bg-black [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce bg-black" />
            </div>
          </motion.div>
        ) : null}

        <div ref={bottomRef} className="h-1 shrink-0" />
      </div>
    </ScrollArea>
  )
}
