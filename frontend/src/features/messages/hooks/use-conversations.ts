import { useMemo } from "react"
import { useMatrixStore } from "@/stores/matrix-store"
import { useAuthStore } from "@/stores/auth-store"
import { useUIStore } from "@/stores/ui-store"
import { useMessageStore } from "../stores/message-store"
import type { Conversation } from "../types"

const CHAT_STATUSES = new Set(["approved", "active", "returned", "overdue"])

export function useConversations() {
  const matrixReady = useMatrixStore((s) => s.isReady)
  const matrixActiveRoomId = useMatrixStore((s) => s.activeRoomId)
  const setMatrixActiveRoom = useMatrixStore((s) => s.setActiveRoom)
  const currentUser = useAuthStore((s) => s.user)

  const borrowRequests = useUIStore((s) => s.borrowRequests)

  // Search + active conversation managed in message-store (UI-only state)
  const searchQuery = useMessageStore((s) => s.searchQuery)
  const mockActiveConversationId = useMessageStore((s) => s.activeConversationId)
  const mockSetActiveConversation = useMessageStore((s) => s.setActiveConversation)
  const setSearchQuery = useMessageStore((s) => s.setSearchQuery)

  const conversations: Conversation[] = useMemo(() => {
    if (!matrixReady) return []

    const seen = new Set<string>()
    const result: Conversation[] = []

    for (const req of borrowRequests) {
      if (!CHAT_STATUSES.has(req.status)) continue

      // Use matrix_room_id as conversation id when available, fall back to request id
      const convId = req.matrixRoomId ?? `req-${req.id}`
      if (seen.has(convId)) continue
      seen.add(convId)

      // Determine the other party: if I am the borrower, other party is the owner; vice versa
      const iAmBorrower = req.borrowerId === currentUser?.id
      const otherName = iAmBorrower ? req.owner.name : req.borrower.name
      const otherMatrixId = iAmBorrower
        ? req.ownerMatrixUserId
        : undefined // incoming requests carry requester_matrix_user_id in a future field

      const initials = otherName
        .split(" ")
        .map((n) => n[0] ?? "")
        .join("")
        .toUpperCase()
        .slice(0, 2)

      result.push({
        id: convId,
        participants: [
          {
            id: otherMatrixId ?? otherName,
            name: otherName,
            avatar: undefined,
            school: iAmBorrower ? req.owner.school : req.borrower.school,
            presence: "offline" as const,
          },
        ],
        counterpartId: otherMatrixId ?? otherName,
        title: otherName,
        resourceId: req.resourceId,
        lastMessagePreview: req.matrixRoomId
          ? "Open chat"
          : "Room being set up…",
        lastMessageAt: req.requestedAt,
        unreadCount: 0,
        pinned: false,
      })
    }

    return result
  }, [matrixReady, borrowRequests, currentUser?.id])

  const activeConversationId = matrixReady
    ? (matrixActiveRoomId ?? mockActiveConversationId)
    : mockActiveConversationId

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
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  )

  const setActiveConversation = (id: string | null) => {
    if (matrixReady && id) {
      setMatrixActiveRoom(id)
    }
    mockSetActiveConversation(id)
  }

  return {
    conversations: filtered,
    activeConversation,
    activeConversationId,
    setActiveConversation,
    searchQuery,
    setSearchQuery,
    isLoading: !matrixReady,
  }
}
