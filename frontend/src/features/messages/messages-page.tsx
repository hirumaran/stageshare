import { useMemo, useEffect } from "react"
import { useParams } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ConversationListPane } from "./components/conversation-list-pane"
import { ChatHeader } from "./components/chat-header"
import { ChatThread } from "./components/chat-thread"
import { MessageInput } from "./components/message-input"
import { EmptyState } from "./components/empty-state"
import { useConversations } from "./hooks/use-conversations"
import { useMessages } from "./hooks/use-messages"
import { useSendMessage } from "./hooks/use-send-message"
import { useMessageSubscription } from "./hooks/use-message-subscription"
import { useMessageStore } from "./stores/message-store"
import { useUIStore } from "@/stores/ui-store"
import { useMatrixStore } from "@/stores/matrix-store"
import { cn } from "@/lib/utils"

export default function MessagesPage() {
  const { conversationId: urlConversationId } = useParams()
  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversation,
    searchQuery,
    setSearchQuery,
  } = useConversations()
  const { grouped } = useMessages(activeConversationId)
  const sendMessage = useSendMessage()
  const { sidebarCollapsed } = useUIStore()
  const matrixIsSyncing = useMatrixStore((s) => s.isSyncing)
  const matrixIsReady = useMatrixStore((s) => s.isReady)

  useMessageSubscription()

  const typingIndicators = useMessageStore((s) => s.typingIndicators)

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations]
  )

  const typingUserName = useMemo(() => {
    if (!activeConversation) return null
    const indicator = typingIndicators.find(
      (t) => t.conversationId === activeConversation.id
    )
    if (!indicator) return null
    const p = activeConversation.participants.find(
      (p) => p.id === indicator.userId
    )
    return p?.name ?? null
  }, [typingIndicators, activeConversation])

  useEffect(() => {
    if (urlConversationId && urlConversationId !== activeConversationId) {
      setActiveConversation(urlConversationId)
    }
  }, [urlConversationId, activeConversationId, setActiveConversation])

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left: Conversation list */}
      <div
        className={cn(
          "flex flex-col border-r border-border/50 bg-[var(--bg-surface)] transition-all duration-300 ease-in-out",
          activeConversationId
            ? "hidden md:flex md:w-[340px]"
            : "flex w-full md:w-[340px]"
        )}
      >
        <ConversationListPane
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={setActiveConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalUnread={totalUnread}
        />
      </div>

      {/* Right: Chat thread */}
      <div
        className={cn(
          "relative flex h-full min-w-0 flex-1 flex-col bg-[var(--bg-base)]",
          activeConversationId ? "flex" : "hidden md:flex"
        )}
      >
        <AnimatePresence mode="wait">
          {matrixIsSyncing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center"
            >
              <div className="text-center space-y-2">
                <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[var(--text-muted)]">
                  Connecting to secure chat...
                </p>
              </div>
            </motion.div>
          ) : activeConversation ? (
            <motion.div
              key="thread"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex h-full flex-col"
            >
              <ChatHeader
                conversation={activeConversation}
                onBack={() => setActiveConversation(null)}
              />
              <ChatThread
                conversation={activeConversation}
                groups={grouped}
                typingUserName={typingUserName}
              />
              <MessageInput
                onSend={(content) =>
                  sendMessage(activeConversation.id, content)
                }
                placeholder={`Message ${activeConversation.title.split(" ")[0]}`}
                disabled={matrixIsSyncing}
              />
            </motion.div>
          ) : (
            <EmptyState key="empty" />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
