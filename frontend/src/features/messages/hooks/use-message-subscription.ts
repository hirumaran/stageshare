import { useEffect } from "react"
import { useMessageStore } from "../stores/message-store"
import { useMatrixStore } from "@/stores/matrix-store"
import type { Message } from "../types"
import { appCurrentUser, participants } from "../lib/seed-data"

function makeId() {
  return `msg-${Math.random().toString(36).slice(2, 9)}`
}

/** Simulate a realistic follow-up reply after the user sends a message */
export function useMessageSubscription() {
  const matrixReady = useMatrixStore((s) => s.isReady)
  const messages = useMessageStore((s) => s.messages)
  const conversations = useMessageStore((s) => s.conversations)
  const addMessage = useMessageStore((s) => s.addMessage)
  const setTyping = useMessageStore((s) => s.setTyping)

  useEffect(() => {
    // Disable mock auto-replies when Matrix is active
    if (matrixReady) return

    const timeouts: number[] = []

    const replyTexts: Record<string, string[]> = {
      "conv-1": [
        "Perfect! I'll have them ready by then.",
        "Let me know if you need anything else!",
      ],
      "conv-2": [
        "Glad to hear that!",
        "Feel free to reach out anytime.",
      ],
    }

    for (const convo of conversations) {
      const list = messages[convo.id] ?? []
      const last = list[list.length - 1]
      if (!last) continue
      if (last.senderId !== appCurrentUser.id) continue
      if (last.status !== "read") continue
      const repliedAlready = list.some(
        (m) =>
          m.senderId !== appCurrentUser.id &&
          new Date(m.sentAt).getTime() > new Date(last.sentAt).getTime()
      )
      if (repliedAlready) continue

      const replies = replyTexts[convo.id]
      if (!replies?.length) continue
      const counterpartId = convo.counterpartId
      if (!counterpartId) continue

      timeouts.push(
        window.setTimeout(() => {
          setTyping(
            {
              conversationId: convo.id,
              userId: counterpartId,
              startedAt: new Date().toISOString(),
            },
            convo.id,
            counterpartId
          )
        }, 600)
      )

      timeouts.push(
        window.setTimeout(() => {
          setTyping(null, convo.id, counterpartId)
          const reply: Message = {
            id: makeId(),
            conversationId: convo.id,
            senderId: counterpartId,
            content: replies[Math.floor(Math.random() * replies.length)],
            sentAt: new Date().toISOString(),
            status: "delivered",
            read: false,
          }
          addMessage(convo.id, reply)
        }, 2200)
      )
    }

    return () => {
      timeouts.forEach((t) => window.clearTimeout(t))
    }
  }, [messages, conversations, addMessage, setTyping, matrixReady])
}
