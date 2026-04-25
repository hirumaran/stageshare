"use client"

import { useMemo } from "react"
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

export function MessagesPage() {
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

  // Simulated real-time replies + typing
  useMessageSubscription()

  const typingIndicators = useMessageStore((s) => s.typingIndicators)
  const allConversations = useMessageStore((s) => s.conversations)

  const totalUnread = useMemo(
    () => allConversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [allConversations],
  )

  const typingUserName = useMemo(() => {
    if (!activeConversation) return null
    const indicator = typingIndicators.find((t) => t.conversationId === activeConversation.id)
    if (!indicator) return null
    const p = activeConversation.participants.find((p) => p.id === indicator.userId)
    return p?.name ?? null
  }, [typingIndicators, activeConversation])

  return (
    <main className="flex h-[100dvh] w-full flex-col bg-background text-foreground">
      {/* App-frame: terminal-style window */}
      <div className="mx-auto flex h-full w-full max-w-[1400px] flex-1 overflow-hidden border-border bg-background sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-xl sm:border sm:shadow-sm">
        {/* macOS window chrome */}
        <div className="flex h-full w-full flex-col">
          <div className="hidden items-center gap-2 border-b border-border px-4 py-3 sm:flex">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            </div>
            <div className="ml-3 flex-1 text-center">
              <p className="font-mono text-xs text-muted-foreground">
                ~/messages {activeConversation ? `— ${activeConversation.title}` : ""}
              </p>
            </div>
            <div className="w-[58px]" aria-hidden="true" />
          </div>

          <div className="flex h-full min-h-0 flex-1">
            {/* Sidebar */}
            <div
              className={cn(
                "h-full",
                // On mobile: show list when nothing is active, hide otherwise
                activeConversationId ? "hidden md:block" : "block w-full md:w-auto",
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

            {/* Main pane */}
            <section
              className={cn(
                "flex h-full min-w-0 flex-1 flex-col",
                activeConversationId ? "flex" : "hidden md:flex",
              )}
              aria-label="Conversation"
            >
              {activeConversation ? (
                <>
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
                    onSend={(body) => sendMessage(activeConversation.id, body)}
                    placeholder={`Message ${activeConversation.title.split(" ")[0]}`}
                  />
                </>
              ) : (
                <EmptyState />
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
