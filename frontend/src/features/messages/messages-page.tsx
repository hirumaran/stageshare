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

  useMessageSubscription()

  const typingIndicators = useMessageStore((s) => s.typingIndicators)
  const allConversations = useMessageStore((s) => s.conversations)

  const totalUnread = useMemo(
    () => allConversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [allConversations],
  )

  const typingUserName = useMemo(() => {
    if (!activeConversation) return null
    const indicator = typingIndicators.find(
      (t) => t.conversationId === activeConversation.id,
    )
    if (!indicator) return null
    const p = activeConversation.participants.find(
      (p) => p.id === indicator.userId,
    )
    return p?.name ?? null
  }, [typingIndicators, activeConversation])

  useEffect(() => {
    if (urlConversationId && urlConversationId !== activeConversationId) {
      setActiveConversation(urlConversationId)
    }
  }, [urlConversationId, activeConversationId, setActiveConversation])

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-full w-full overflow-hidden rounded-lg">
        {/* Left: Conversation list — slightly lighter */}
        <div
          className={cn(
            "flex flex-col border-r border-border bg-[var(--bg-surface)]",
            activeConversationId
              ? "hidden md:flex md:w-[340px]"
              : "flex w-full md:w-[340px]",
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

        {/* Right: Chat thread — darkest */}
        <div
          className={cn(
            "flex h-full min-w-0 flex-1 flex-col bg-[var(--bg-base)]",
            activeConversationId ? "flex" : "hidden md:flex",
          )}
        >
          <AnimatePresence mode="wait">
            {activeConversation ? (
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
                />
              </motion.div>
            ) : (
              <EmptyState key="empty" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
