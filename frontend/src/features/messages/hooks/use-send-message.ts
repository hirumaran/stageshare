import { useCallback } from "react"
import { useMessageStore } from "../stores/message-store"
import { useMatrixStore } from "@/stores/matrix-store"
import { appCurrentUser } from "../lib/seed-data"
import type { Message } from "../types"
import { generateId } from "@/lib/utils"

export function useSendMessage() {
  const addMessage = useMessageStore((s) => s.addMessage)
  const updateMessageStatus = useMessageStore(
    (s) => s.updateMessageStatus
  )
  const matrixSendMessage = useMatrixStore((s) => s.sendMessage)
  const matrixReady = useMatrixStore((s) => s.isReady)

  return useCallback(
    (conversationId: string, content: string) => {
      const trimmed = content.trim()
      if (!trimmed) return

      if (matrixReady) {
        // Send via Matrix; timeline events will populate messages
        matrixSendMessage(conversationId, trimmed).catch((err) =>
          console.error("[Matrix] Send failed:", err)
        )
        return
      }

      // Fallback mock send
      const tempId = `msg-${generateId()}`
      const now = new Date().toISOString()
      const optimistic: Message = {
        id: tempId,
        conversationId,
        senderId: appCurrentUser.id,
        content: trimmed,
        sentAt: now,
        status: "sending",
        read: true,
        pending: true,
      }
      addMessage(conversationId, optimistic)

      window.setTimeout(
        () => updateMessageStatus(conversationId, tempId, "sent"),
        350
      )
      window.setTimeout(
        () => updateMessageStatus(conversationId, tempId, "delivered"),
        900
      )
      window.setTimeout(
        () => updateMessageStatus(conversationId, tempId, "read"),
        1800
      )
    },
    [addMessage, updateMessageStatus, matrixSendMessage, matrixReady]
  )
}
