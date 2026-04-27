import { useMemo } from "react"
import { useMessageStore } from "../stores/message-store"
import { useMatrixStore } from "@/stores/matrix-store"
import { useAuthStore } from "@/stores/auth-store"
import { mapMatrixConversation } from "../lib/matrix-adapter"

export function useConversations() {
  const matrixReady = useMatrixStore((s) => s.isReady)
  const matrixConversations = useMatrixStore((s) => s.conversations)
  const matrixActiveRoomId = useMatrixStore((s) => s.activeRoomId)
  const setMatrixActiveRoom = useMatrixStore((s) => s.setActiveRoom)
  const currentMatrixUserId = useAuthStore((s) => s.user?.matrixUserId)

  const mockConversations = useMessageStore((s) => s.conversations)
  const mockSearchQuery = useMessageStore((s) => s.searchQuery)
  const mockActiveConversationId = useMessageStore(
    (s) => s.activeConversationId
  )
  const mockSetActiveConversation = useMessageStore(
    (s) => s.setActiveConversation
  )
  const mockSetSearchQuery = useMessageStore((s) => s.setSearchQuery)

  const conversations = useMemo(() => {
    if (matrixReady) {
      return matrixConversations.map((mc) =>
        mapMatrixConversation(mc, currentMatrixUserId)
      )
    }
    return mockConversations
  }, [matrixReady, matrixConversations, mockConversations, currentMatrixUserId])

  const activeConversationId = matrixReady
    ? matrixActiveRoomId
    : mockActiveConversationId

  const searchQuery = mockSearchQuery

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const sorted = [...conversations].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return (
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
      )
    })
    if (!q) return sorted
    return sorted.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.lastMessagePreview.toLowerCase().includes(q) ||
        c.participants.some((p) => p.name.toLowerCase().includes(q))
    )
  }, [conversations, searchQuery])

  const activeConversation = useMemo(
    () =>
      conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  )

  const setActiveConversation = (id: string | null) => {
    if (matrixReady && id) {
      setMatrixActiveRoom(id)
    } else {
      mockSetActiveConversation(id)
    }
  }

  return {
    conversations: filtered,
    activeConversation,
    activeConversationId,
    setActiveConversation,
    searchQuery,
    setSearchQuery: mockSetSearchQuery,
  }
}
