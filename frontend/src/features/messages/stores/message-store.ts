import { create } from "zustand"
import type { Conversation, Message, MessageStatus, TypingIndicator } from "../types"
import {
  conversations as seedConversations,
  messagesByConversation as seedMessages,
  appCurrentUser,
} from "../lib/seed-data"

interface MessageStoreState {
  conversations: Conversation[]
  messages: Record<string, Message[]>
  activeConversationId: string | null
  typingIndicators: TypingIndicator[]
  searchQuery: string

  // Selection
  setActiveConversation: (id: string | null) => void
  setSearchQuery: (q: string) => void

  // Messages
  addMessage: (conversationId: string, message: Message) => void
  updateMessageStatus: (conversationId: string, messageId: string, status: MessageStatus) => void
  replaceMessage: (conversationId: string, tempId: string, message: Message) => void
  markConversationRead: (conversationId: string) => void

  // Typing
  setTyping: (indicator: TypingIndicator | null, conversationId: string, userId: string) => void

  // Computed
  totalUnread: () => number
}

export const useMessageStore = create<MessageStoreState>((set, get) => ({
  conversations: seedConversations,
  messages: seedMessages,
  activeConversationId: seedConversations[0]?.id ?? null,
  typingIndicators: [],
  searchQuery: "",

  setActiveConversation: (id) =>
    set((state) => {
      if (!id) return { activeConversationId: null }
      const conversations = state.conversations.map((c) =>
        c.id === id ? { ...c, unreadCount: 0 } : c,
      )
      return { activeConversationId: id, conversations }
    }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] ?? []
      // Deduplicate on id to prevent double-renders
      if (existing.some((m) => m.id === message.id)) return state

      const conversations = state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastMessagePreview: message.content || "Sent a message",
              lastMessageAt: message.sentAt,
              unreadCount: message.senderId === appCurrentUser.id ? 0 : c.unreadCount + 1,
            }
          : c,
      )
      return {
        messages: { ...state.messages, [conversationId]: [...existing, message] },
        conversations,
      }
    }),

  updateMessageStatus: (conversationId, messageId, status) =>
    set((state) => {
      const list = state.messages[conversationId]
      if (!list) return state
      return {
        messages: {
          ...state.messages,
          [conversationId]: list.map((m) =>
            m.id === messageId ? { ...m, status, pending: status === "sending", read: status === "read" } : m,
          ),
        },
      }
    }),

  replaceMessage: (conversationId, tempId, message) =>
    set((state) => {
      const list = state.messages[conversationId]
      if (!list) return state
      return {
        messages: {
          ...state.messages,
          [conversationId]: list.map((m) => (m.id === tempId ? message : m)),
        },
      }
    }),

  markConversationRead: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    })),

  setTyping: (indicator, conversationId, userId) =>
    set((state) => {
      const filtered = state.typingIndicators.filter(
        (t) => !(t.conversationId === conversationId && t.userId === userId),
      )
      return {
        typingIndicators: indicator ? [...filtered, indicator] : filtered,
      }
    }),

  totalUnread: () => get().conversations.reduce((sum, c) => sum + c.unreadCount, 0),
}))
