import type { Message, Conversation, MessageParticipant, PresenceStatus } from "../types"
import { mockUsers, mockConversations, mockMessages, currentUser } from "@/data/mock-data"

function getPresence(userId: string): PresenceStatus {
  const map: Record<string, PresenceStatus> = {
    "user-1": "online",
    "user-2": "away",
    "user-3": "online",
    "user-4": "offline",
  }
  return map[userId] ?? "offline"
}

export function toMessageParticipant(user: typeof mockUsers[0]): MessageParticipant {
  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    school: user.school,
    presence: getPresence(user.id),
  }
}

export const appCurrentUser = toMessageParticipant(currentUser)
export const participants: MessageParticipant[] = mockUsers.map(toMessageParticipant)

/** Generate deterministic last-message timestamps at PM hours */
const base = new Date()
base.setHours(14, 30, 0, 0)
const minutesAgo = (m: number) => {
  const d = new Date(base)
  d.setMinutes(d.getMinutes() - m)
  return d.toISOString()
}
const hoursAgo = (h: number) => {
  const d = new Date(base)
  d.setHours(d.getHours() - h)
  return d.toISOString()
}
const daysAgo = (d: number) => {
  const dt = new Date(base)
  dt.setDate(dt.getDate() - d)
  return dt.toISOString()
}

export const conversations: Conversation[] = mockConversations.map((conv, i) => {
  const otherParticipant = conv.participants.find((p) => p.id !== currentUser.id)
  const lastMsg = conv.lastMessage
  const ts = i === 0
    ? minutesAgo(2)
    : i === 1
      ? hoursAgo(3)
      : daysAgo(i - 1)

  return {
    id: conv.id,
    participants: conv.participants.map(toMessageParticipant),
    counterpartId: otherParticipant?.id ?? null,
    title: otherParticipant?.name ?? "Costume inquiry",
    resourceId: conv.resourceId,
    resource: conv.resource,
    lastMessagePreview: lastMsg?.content ?? "No messages yet",
    lastMessageAt: ts,
    unreadCount: conv.unreadCount,
    pinned: i === 0,
  }
})

conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

export const messagesByConversation: Record<string, Message[]> = {}

for (const msg of mockMessages) {
  const m: Message = {
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    content: msg.content,
    sentAt: msg.sentAt,
    status: msg.read ? "read" : "delivered",
    read: msg.read,
  }
  if (!messagesByConversation[msg.conversationId]) {
    messagesByConversation[msg.conversationId] = []
  }
  messagesByConversation[msg.conversationId].push(m)
}

for (const key of Object.keys(messagesByConversation)) {
  messagesByConversation[key].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
}
