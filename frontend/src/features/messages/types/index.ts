import type { User, Resource } from "@/types"

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed"

export type PresenceStatus = "online" | "away" | "offline"

export interface MessageParticipant {
  id: string
  name: string
  avatar?: string
  school?: string
  presence: PresenceStatus
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  sentAt: string
  status: MessageStatus
  read: boolean
  /** Optimistic flag for messages awaiting server ack */
  pending?: boolean
}

export interface Conversation {
  id: string
  participants: MessageParticipant[]
  /** ID of the "other" participant for 1:1 chats; null for groups */
  counterpartId: string | null
  title: string
  resourceId?: string
  resource?: Resource
  lastMessagePreview: string
  lastMessageAt: string
  unreadCount: number
  pinned?: boolean
}

export interface TypingIndicator {
  conversationId: string
  userId: string
  startedAt: string
}
