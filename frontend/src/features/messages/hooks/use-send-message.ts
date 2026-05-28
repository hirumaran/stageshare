import { useCallback } from "react"
import { useMatrixStore } from "@/stores/matrix-store"

export function useSendMessage() {
  const matrixSendMessage = useMatrixStore((s) => s.sendMessage)
  const matrixReady = useMatrixStore((s) => s.isReady)

  return useCallback(
    (conversationId: string, content: string) => {
      const trimmed = content.trim()
      if (!trimmed || !matrixReady) return
      matrixSendMessage(conversationId, trimmed).catch((err) =>
        console.error("[Matrix] Send failed:", err)
      )
    },
    [matrixSendMessage, matrixReady]
  )
}
