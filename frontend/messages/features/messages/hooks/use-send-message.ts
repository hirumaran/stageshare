"use client"

import { useCallback } from "react"
import { useMessageStore } from "../stores/message-store"
import { currentUser } from "../lib/seed-data"
import type { Message } from "../types"

function makeId() {
  return `m_${Math.random().toString(36).slice(2, 10)}`
}

export function useSendMessage() {
  const addMessage = useMessageStore((s) => s.addMessage)
  const updateMessageStatus = useMessageStore((s) => s.updateMessageStatus)

  return useCallback(
    (conversationId: string, body: string) => {
      const trimmed = body.trim()
      if (!trimmed) return

      const tempId = makeId()
      const now = new Date().toISOString()
      const optimistic: Message = {
        id: tempId,
        conversationId,
        authorId: currentUser.id,
        body: trimmed,
        createdAt: now,
        status: "sending",
        pending: true,
      }
      addMessage(conversationId, optimistic)

      // Simulate network: sent → delivered → read
      window.setTimeout(() => updateMessageStatus(conversationId, tempId, "sent"), 350)
      window.setTimeout(() => updateMessageStatus(conversationId, tempId, "delivered"), 900)
      window.setTimeout(() => updateMessageStatus(conversationId, tempId, "read"), 1800)
    },
    [addMessage, updateMessageStatus],
  )
}
