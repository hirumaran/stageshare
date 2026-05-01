import { useMemo, useEffect } from "react"
import { useParams } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, MessageSquareText, Sparkles } from "lucide-react"
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
  const { setSidebarOpen } = useUIStore()
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
    <div className="relative flex h-full w-full overflow-hidden bg-[#f4f1ea] text-black selection:bg-black selection:text-[#ffc425]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(#000_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 border-b-[5px] border-l-[5px] border-black bg-[#ffc425]" />
      <div className="pointer-events-none absolute bottom-8 left-[35%] hidden h-24 w-24 rotate-12 border-[3px] border-black bg-[#7ed7c1] lg:block" />

      <div
        className={cn(
          "relative z-10 flex flex-col border-r-[5px] border-black bg-[#fbfaf7] transition-all duration-300 ease-in-out",
          activeConversationId
            ? "hidden md:flex md:w-[360px] xl:w-[400px]"
            : "flex w-full md:w-[360px] xl:w-[400px]"
        )}
      >
        <div className="flex h-20 items-center justify-between border-b-[4px] border-black bg-[#fbfaf7] px-5 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="grid h-11 w-11 place-items-center border-2 border-black bg-white transition-colors hover:bg-black hover:text-white"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-2xl font-black uppercase">SKĒNĒ</span>
          <span className="h-11 w-11" aria-hidden="true" />
        </div>

        <ConversationListPane
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={setActiveConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalUnread={totalUnread}
        />
      </div>

      <div
        className={cn(
          "relative z-10 flex h-full min-w-0 flex-1 flex-col bg-[#f4f1ea]",
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
              <div className="border-[3px] border-black bg-[#fbfaf7] p-8 text-center shadow-[8px_8px_0_#000]">
                <div className="mx-auto mb-5 grid h-14 w-14 place-items-center border-[3px] border-black bg-[#ffc425]">
                  <Sparkles className="h-6 w-6 animate-pulse" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-black">
                  Connecting secure chat
                </p>
                <div className="mt-4 h-2 w-48 overflow-hidden border-2 border-black bg-white">
                  <div className="h-full w-1/2 animate-pulse bg-black" />
                </div>
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
            <div className="relative flex h-full flex-col">
              <header className="flex h-20 items-center justify-between border-b-[5px] border-black bg-[#fbfaf7] px-6 lg:hidden">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="grid h-11 w-11 place-items-center border-2 border-black bg-white transition-colors hover:bg-black hover:text-white"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em]">
                  <MessageSquareText className="h-5 w-5" />
                  Messages
                </div>
                <span className="h-11 w-11" aria-hidden="true" />
              </header>
              <EmptyState key="empty" />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
