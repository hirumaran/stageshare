import { useMemo, useCallback, useState } from "react"
import { useMatrixStore } from "@/stores/matrix-store"
import { useAuthStore } from "@/stores/auth-store"
import { useUIStore } from "@/stores/ui-store"
import { useMessageStore } from "../stores/message-store"
import { apiFetch } from "@/lib/api"
import type { Conversation } from "../types"

const CHAT_STATUSES = new Set(["approved", "active", "returned", "overdue"])

export function useConversations() {
  const matrixReady = useMatrixStore((s) => s.isReady)
  const matrixActiveRoomId = useMatrixStore((s) => s.activeRoomId)
  const setMatrixActiveRoom = useMatrixStore((s) => s.setActiveRoom)
  const currentUser = useAuthStore((s) => s.user)

  const borrowRequests = useUIStore((s) => s.borrowRequests)
  const setRequestMatrixRoomId = useUIStore((s) => s.setRequestMatrixRoomId)

  // Search + active conversation managed in message-store (UI-only state)
  const searchQuery = useMessageStore((s) => s.searchQuery)
  const mockActiveConversationId = useMessageStore((s) => s.activeConversationId)
  const mockSetActiveConversation = useMessageStore((s) => s.setActiveConversation)
  const setSearchQuery = useMessageStore((s) => s.setSearchQuery)

  // Per-conversation retry error state: requestId → error message
  const [retryErrors, setRetryErrors] = useState<Record<string, string>>({})

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
        : req.borrower.matrixUserId

      const isReady = !!req.matrixRoomId

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
        lastMessagePreview: isReady
          ? "Open chat"
          : "Chat setup incomplete",
        lastMessageAt: req.requestedAt,
        unreadCount: 0,
        pinned: false,
        isReady,
        requestId: req.id,
        borrowerMatrixUserId: req.borrower.matrixUserId,
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

  /**
   * Retry room setup for an approved/active request whose matrix_room_id is null.
   * Room creation is server-side (Workstream A1/A2), so EITHER party can trigger
   * it — the backend re-enqueues a deduped job under the server actor. If the
   * room is already ready, the response carries its id; otherwise it's pending
   * and the next borrow-requests refresh will surface it.
   */
  const retryRoomSetup = useCallback(
    async (requestId: string) => {
      // Clear any prior error for this request
      setRetryErrors((prev) => {
        const next = { ...prev }
        delete next[requestId]
        return next
      })

      try {
        // apiFetch returns the parsed JSON body (and throws on non-2xx).
        const data = await apiFetch(`/requests/${requestId}/room/retry`, {
          method: "POST",
        })
        if (data?.matrixRoomId) {
          // Already ready — flip the conversation to isReady: true immediately.
          setRequestMatrixRoomId(requestId, data.matrixRoomId)
        } else {
          // Pending — the server worker is creating it; surface a non-error hint.
          setRetryErrors((prev) => ({
            ...prev,
            [requestId]: "Setting up chat… refresh in a moment.",
          }))
        }
      } catch (err) {
        console.error("[Matrix] Retry room setup failed:", err)
        setRetryErrors((prev) => ({
          ...prev,
          [requestId]: "Chat setup failed. Please try again.",
        }))
      }
    },
    [setRequestMatrixRoomId]
  )

  return {
    conversations: filtered,
    activeConversation,
    activeConversationId,
    setActiveConversation,
    searchQuery,
    setSearchQuery,
    isLoading: !matrixReady,
    retryRoomSetup,
    retryErrors,
  }
}
