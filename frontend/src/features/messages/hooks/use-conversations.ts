import { useMemo } from "react"
import { useMessageStore } from "../stores/message-store"

export function useConversations() {
  const conversations = useMessageStore((s) => s.conversations)
  const searchQuery = useMessageStore((s) => s.searchQuery)
  const activeConversationId = useMessageStore((s) => s.activeConversationId)
  const setActiveConversation = useMessageStore((s) => s.setActiveConversation)
  const setSearchQuery = useMessageStore((s) => s.setSearchQuery)

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const sorted = [...conversations].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    })
    if (!q) return sorted
    return sorted.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.lastMessagePreview.toLowerCase().includes(q) ||
        c.participants.some((p) => p.name.toLowerCase().includes(q)),
    )
  }, [conversations, searchQuery])

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  )

  return {
    conversations: filtered,
    activeConversation,
    activeConversationId,
    setActiveConversation,
    searchQuery,
    setSearchQuery,
  }
}
