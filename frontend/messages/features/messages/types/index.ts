export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed"

export type PresenceStatus = "online" | "away" | "offline"

export interface MessageAttachment {
  id: string
  name: string
  type: "image" | "file"
  url?: string
  size?: number
}

export interface Message {
  id: string
  conversationId: string
  authorId: string
  body: string
  createdAt: string
  status: MessageStatus
  attachments?: MessageAttachment[]
  /** Optimistic flag for messages awaiting server ack */
  pending?: boolean
}

export interface Participant {
  id: string
  name: string
  handle: string
  avatarUrl?: string
  presence: PresenceStatus
}

export interface Conversation {
  id: string
  participants: Participant[]
  /** ID of the "other" participant for 1:1 chats; null for groups */
  counterpartId: string | null
  title: string
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

export interface CurrentUser {
  id: string
  name: string
  handle: string
  avatarUrl?: string
}
