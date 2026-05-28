import type { MatrixConversation, MatrixMessage, User } from "@/types"
import type {
  Conversation,
  Message,
  MessageParticipant,
  PresenceStatus,
} from "../types"
import { appCurrentUser } from "./seed-data"

function getPresence(_userId: string): PresenceStatus {
  // Matrix presence not yet wired; default to offline for safety
  return "offline"
}

export function mapMatrixParticipant(
  matrixId: string,
  name: string
): MessageParticipant {
  return {
    id: matrixId,
    name,
    avatar: undefined,
    school: "",
    presence: getPresence(matrixId),
  }
}

export function mapMatrixConversation(
  mc: MatrixConversation,
  currentMatrixUserId?: string
): Conversation {
  const otherId = currentMatrixUserId
    ? mc.roomId // fallback seed; participants will be rebuilt from timeline if needed
    : mc.roomId

  const otherParticipant = mapMatrixParticipant(otherId, mc.name)
  const meParticipant = mapMatrixParticipant(
    currentMatrixUserId ?? appCurrentUser.id,
    appCurrentUser.name
  )

  return {
    id: mc.roomId,
    participants: [otherParticipant, meParticipant],
    counterpartId: otherParticipant.id,
    title: mc.name,
    lastMessagePreview: mc.lastMessage || "No messages yet",
    lastMessageAt: mc.lastMessageAt?.toISOString() ?? new Date().toISOString(),
    unreadCount: mc.unreadCount,
    pinned: false,
    isReady: true,
    requestId: mc.roomId,
  }
}

export function mapMatrixMessage(mm: MatrixMessage): Message {
  return {
    id: mm.id,
    conversationId: mm.roomId,
    senderId: mm.senderId,
    content: mm.content,
    sentAt: mm.timestamp.toISOString(),
    status: mm.isMe ? "sent" : "delivered",
    read: mm.isMe,
    pending: false,
  }
}
