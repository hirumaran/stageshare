import { useState, useEffect, useRef, useCallback, Fragment } from "react"
import { useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/stores/auth-store"
import { useUIStore } from "@/stores/ui-store"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Send,
  Search,
  ArrowLeft,
  Paperclip,
  Plus,
  Phone,
  Video,
  MoreVertical,
} from "lucide-react"
import { cn, formatRelativeTime, getInitials } from "@/lib/utils"
import type { Message, Conversation, User } from "@/types"

/* ─── Helpers ─── */
function formatMessageDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

/* ─── Search input ─── */
function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder ?? "Search..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 pl-9 pr-4 rounded-lg bg-muted dark:bg-zinc-800 text-sm text-foreground placeholder:text-muted-foreground border border-transparent focus:border-border focus:outline-none transition-colors"
      />
    </div>
  )
}

/* ─── Conversation list item ─── */
function ConversationListItem({
  conversation,
  currentUser,
  isActive,
  onClick,
}: {
  conversation: Conversation
  currentUser: User
  isActive: boolean
  onClick: () => void
}) {
  const partner = conversation.participants.find((p) => p.id !== currentUser.id)
  if (!partner) return null

  const unread = conversation.unreadCount > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full flex items-start gap-3 px-3 py-3 text-left rounded-lg transition-colors relative",
        isActive
          ? "bg-zinc-800"
          : "hover:bg-zinc-800/50"
      )}
    >
      {/* Left accent bar — only when active */}
      {isActive && (
        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-orange-500 rounded-full" />
      )}

      <div className="relative flex-shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src={partner.avatar} alt={partner.name} />
          <AvatarFallback className="text-[10px] font-medium">
            {getInitials(partner.name)}
          </AvatarFallback>
        </Avatar>
        {unread && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-zinc-900" />
        )}
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <p
            className={cn(
              "text-sm truncate",
              unread ? "font-medium text-zinc-100" : "text-zinc-100"
            )}
          >
            {partner.name}
          </p>
          {conversation.lastMessage && (
            <span className="text-[11px] text-zinc-500 flex-shrink-0 tabular-nums">
              {formatRelativeTime(conversation.lastMessage.sentAt)}
            </span>
          )}
        </div>

        {/* Topic tag */}
        <p className="text-[10px] text-zinc-500 mb-1 truncate">
          {conversation.resource?.title ?? "Costume inquiry"}
        </p>

        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "text-[13px] truncate leading-snug",
              unread ? "text-zinc-100 font-medium" : "text-zinc-400"
            )}
          >
            {conversation.lastMessage?.content ?? "No messages yet"}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="flex-shrink-0 bg-orange-500 text-white text-[11px] font-semibold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

/* ─── Conversation list pane ─── */
function ConversationListPane({
  currentUser,
  conversations,
  selectedId,
  onSelect,
}: {
  currentUser: User
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = conversations.filter((c) => {
    if (!searchQuery) return true
    const partner = c.participants.find((p) => p.id !== currentUser.id)
    return partner?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  })

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-lg tracking-tight text-zinc-100">Messages</h1>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <SearchInput value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* List */}
      <ScrollArea className="flex-1 px-2 pb-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            No conversations found
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                currentUser={currentUser}
                isActive={selectedId === conv.id}
                onClick={() => onSelect(conv.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

/* ─── Date separator ─── */
function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px bg-zinc-800" />
      <span className="text-[11px] font-medium text-zinc-600 tracking-wider select-none">
        {formatMessageDate(date)}
      </span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  )
}

/* ─── Message bubble ─── */
function MessageBubble({
  message,
  isOwn,
  partner,
}: {
  message: Message
  isOwn: boolean
  partner: User | undefined
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex items-end gap-2.5",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar — only on received */}
      {!isOwn && partner && (
        <Avatar className="h-8 w-8 shrink-0 mb-0.5">
          <AvatarImage src={partner.avatar} alt={partner.name} />
          <AvatarFallback className="text-[10px]">
            {getInitials(partner.name)}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Bubble + timestamp */}
      <div className={cn("flex flex-col gap-1 max-w-[70%]", isOwn ? "items-end" : "items-start")}>
        <div
          className={cn(
            "px-4 py-2.5 text-sm leading-relaxed",
            isOwn
              ? "bg-orange-500 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-[6px]"
              : "bg-zinc-800 text-zinc-100 rounded-tl-[6px] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl"
          )}
        >
          {message.content}
        </div>
        <span className="text-[11px] text-zinc-500 px-1">
          {formatRelativeTime(message.sentAt)}
        </span>
      </div>
    </motion.div>
  )
}

/* ─── Chat thread ─── */
function ChatThread({
  conversation,
  messages,
  currentUser,
  partner,
  onBack,
  onSend,
}: {
  conversation: Conversation
  messages: Message[]
  currentUser: User
  partner: User | undefined
  onBack: () => void
  onSend: (content: string) => void
}) {
  const [draft, setDraft] = useState("")
  const threadRef = useRef<HTMLDivElement>(null)

  const hasText = draft.trim().length > 0

  const scrollToBottom = useCallback(() => {
    // With flex-col-reverse, scrollTop 0 IS the bottom
    threadRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  const handleSend = () => {
    if (!hasText) return
    onSend(draft.trim())
    setDraft("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 relative">
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-3.5 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden -ml-1 rounded-full h-8 w-8 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={partner?.avatar} alt={partner?.name} />
            <AvatarFallback className="text-xs">
              {partner ? getInitials(partner.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-100 truncate leading-tight">{partner?.name}</p>
          <p className="text-xs text-zinc-500 truncate leading-tight">
            {partner?.school ?? "Big Picture School"}
          </p>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1">
          <button
            aria-label="Voice call"
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-150 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 cursor-pointer"
          >
            <Phone size={16} strokeWidth={1.75} />
          </button>
          <button
            aria-label="Video call"
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-150 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 cursor-pointer"
          >
            <Video size={16} strokeWidth={1.75} />
          </button>
          <button
            aria-label="More options"
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-150 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 cursor-pointer"
          >
            <MoreVertical size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={threadRef}
        className="flex-1 overflow-y-auto flex flex-col-reverse gap-3 px-6 py-4"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
              <Send className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="font-display text-base text-zinc-100 mb-1">
              Start the conversation
            </p>
            <p className="text-sm text-zinc-500">
              Send a message to {partner?.name?.split(" ")[0] ?? "them"}
            </p>
          </div>
        ) : (
          <>
            {[...messages].reverse().map((msg, i, arr) => {
              const prevMsg = arr[i + 1]
              const showDateSeparator = prevMsg && !isSameDay(msg.sentAt, prevMsg.sentAt)

              return (
                <Fragment key={msg.id}>
                  <MessageBubble
                    message={msg}
                    isOwn={msg.senderId === currentUser.id}
                    partner={partner}
                  />
                  {showDateSeparator && (
                    <DateSeparator date={msg.sentAt} />
                  )}
                </Fragment>
              )
            })}

            {/* Beginning anchor */}
            <div className="flex items-center justify-center py-8">
              <span className="text-xs text-zinc-600">
                Start of your conversation with {partner?.name}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Input dock */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-zinc-800 bg-zinc-900">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {/* Attachment — ghost icon button */}
          <button
            aria-label="Attach file"
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-150 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 cursor-pointer"
          >
            <Paperclip size={16} strokeWidth={1.75} />
          </button>

          {/* Text input */}
          <input
            type="text"
            placeholder={`Message ${partner?.name?.split(" ")[0] ?? ""}...`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none caret-orange-500 min-w-0"
          />

          {/* Send — orange filled icon button */}
          <button
            aria-label="Send message"
            onClick={handleSend}
            disabled={!hasText}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-150",
              hasText
                ? "bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white cursor-pointer"
                : "bg-zinc-800 text-zinc-600 cursor-default"
            )}
          >
            <Send size={15} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main page ─── */
export default function MessagesPage() {
  const { conversationId } = useParams()
  const { user } = useAuthStore()
  const {
    conversations,
    messages: messageMap,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markConversationRead,
  } = useUIStore()

  const [selectedId, setSelectedId] = useState<string | null>(conversationId ?? null)

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId)
      markConversationRead(selectedId)
    }
  }, [selectedId, fetchMessages, markConversationRead])

  useEffect(() => {
    if (conversationId) setSelectedId(conversationId)
  }, [conversationId])

  if (!user) return null

  const activeConversation = conversations.find((c) => c.id === selectedId)
  const activePartner = activeConversation?.participants.find((p) => p.id !== user.id)
  const activeMessages = selectedId ? messageMap[selectedId] ?? [] : []

  const handleSelect = (id: string) => setSelectedId(id)
  const handleBack = () => setSelectedId(null)
  const handleSend = (content: string) => {
    if (selectedId) sendMessage(selectedId, content)
  }

  return (
    <div className="h-full flex">
      {/* Desktop list pane */}
      <div className="hidden lg:flex w-[340px] flex-shrink-0 border-r border-zinc-800">
        <ConversationListPane
          currentUser={user}
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      {/* Desktop thread pane */}
      <div className="hidden lg:flex flex-1 flex-col min-w-0">
        {activePartner && activeConversation ? (
          <ChatThread
            conversation={activeConversation}
            messages={activeMessages}
            currentUser={user}
            partner={activePartner}
            onBack={handleBack}
            onSend={handleSend}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center bg-zinc-900">
            <div className="max-w-xs">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-5">
                <Send className="h-6 w-6 text-zinc-500" />
              </div>
              <p className="font-display text-base text-zinc-100 mb-1.5">
                Select a conversation
              </p>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile / Tablet */}
      <div className="lg:hidden flex-1 relative">
        <AnimatePresence mode="wait">
          {!selectedId ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <ConversationListPane
                currentUser={user}
                conversations={conversations}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            </motion.div>
          ) : activePartner && activeConversation ? (
            <motion.div
              key="thread"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <ChatThread
                conversation={activeConversation}
                messages={activeMessages}
                currentUser={user}
                partner={activePartner}
                onBack={handleBack}
                onSend={handleSend}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
