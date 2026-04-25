"use client"

import { useEffect } from "react"
import { useMessageStore } from "../stores/message-store"
import type { Message } from "../types"

const AUTO_REPLIES: Record<string, string[]> = {
  c_ada: [
    "Take your time — I'll be reviewing in parallel.",
    "Also, I left a note in the comments about the Bernoulli step.",
  ],
  c_grace: ["Ping me if anything regresses overnight.", "I'll keep the build watcher running."],
  c_linus: ["Don't forget to sign off your commits.", "Send me the diff when you're done."],
  c_margaret: ["Telemetry looks clean.", "I'll keep an eye on the trajectory window."],
  c_alan: ["Some problems are worth not solving.", "Curious what you'd build next."],
  c_dennis: ["And always check the return value.", "K&R is still the best reference."],
}

function makeId() {
  return `m_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Simulates a real-time subscription. When the user sends a message in a
 * conversation, the counterpart "types" and replies after a short delay.
 */
export function useMessageSubscription() {
  const messages = useMessageStore((s) => s.messages)
  const conversations = useMessageStore((s) => s.conversations)
  const addMessage = useMessageStore((s) => s.addMessage)
  const setTyping = useMessageStore((s) => s.setTyping)

  useEffect(() => {
    // For each conversation, if the most recent message is from the user
    // and is "read" (fully delivered), trigger a typing + reply once.
    const timeouts: number[] = []

    for (const convo of conversations) {
      const list = messages[convo.id] ?? []
      const last = list[list.length - 1]
      if (!last) continue
      if (last.authorId !== "u_me") continue
      if (last.status !== "read") continue
      // Don't reply if the previous reply already happened after this message
      const repliedAlready = list.some(
        (m) =>
          m.authorId !== "u_me" &&
          new Date(m.createdAt).getTime() > new Date(last.createdAt).getTime(),
      )
      if (repliedAlready) continue

      const replies = AUTO_REPLIES[convo.id]
      if (!replies?.length) continue
      const counterpartId = convo.counterpartId
      if (!counterpartId) continue

      // Show typing indicator
      const typingTimeout = window.setTimeout(() => {
        setTyping(
          { conversationId: convo.id, userId: counterpartId, startedAt: new Date().toISOString() },
          convo.id,
          counterpartId,
        )
      }, 600)

      // Send reply and clear typing
      const replyTimeout = window.setTimeout(() => {
        setTyping(null, convo.id, counterpartId)
        const reply: Message = {
          id: makeId(),
          conversationId: convo.id,
          authorId: counterpartId,
          body: replies[Math.floor(Math.random() * replies.length)],
          createdAt: new Date().toISOString(),
          status: "delivered",
        }
        addMessage(convo.id, reply)
      }, 2200)

      timeouts.push(typingTimeout, replyTimeout)
    }

    return () => {
      timeouts.forEach((t) => window.clearTimeout(t))
    }
  }, [messages, conversations, addMessage, setTyping])
}
