// User types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  school?: string
  bio?: string
  joinedAt: string
  resourcesShared: number
  resourcesBorrowed: number
  matrixUserId?: string
  matrixAccessToken?: string
  matrixDeviceId?: string
}

// Matrix / Messaging types
export interface MatrixMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
  isMe: boolean
  type: "text" | "image" | "file"
}

export interface MatrixConversation {
  roomId: string
  name: string
  avatarInitials: string
  schoolName: string
  lastMessage: string
  lastMessageAt: Date | null
  unreadCount: number
  isDM: boolean
  linkedRequestId?: number
}

// Resource types
export type ResourceCategory =
  | "scripts"
  | "lesson-plans"
  | "costumes"
  | "props"
  | "lighting"
  | "sound"
  | "set-design"
  | "makeup"
  | "music"
  | "other"

export type ResourceCondition = "excellent" | "good" | "fair" | "worn"

export type ResourceStatus = "available" | "borrowed" | "reserved" | "unavailable"

export interface Resource {
  id: string
  title: string
  description: string
  category: ResourceCategory
  condition: ResourceCondition
  status: ResourceStatus
  images: string[]
  tags: string[]
  ownerId: string
  owner: User
  createdAt: string
  updatedAt: string
  borrowCount: number
  rating: number
  reviewCount: number
}

// Borrowing types
export type BorrowRequestStatus = "pending" | "approved" | "rejected" | "returned" | "overdue"

export interface BorrowRequest {
  id: string
  resourceId: string
  resource: Resource
  borrowerId: string
  borrower: User
  ownerId: string
  owner: User
  status: BorrowRequestStatus
  requestedAt: string
  startDate: string
  endDate: string
  returnedAt?: string
  message?: string
  ownerResponse?: string
  ownerMatrixUserId?: string
}

// Cart types
export interface CartItem {
  id: string
  resource: Resource
  startDate: string
  endDate: string
  message?: string
}

// Message types
export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  sentAt: string
  read: boolean
}

export interface Conversation {
  id: string
  participants: User[]
  resourceId?: string
  resource?: Resource
  lastMessage?: Message
  unreadCount: number
  updatedAt: string
}

// Notification types
export type NotificationType =
  | "borrow_request"
  | "request_approved"
  | "request_rejected"
  | "item_returned"
  | "new_message"
  | "review_received"
  | "reminder"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
  actionUrl?: string
  resourceId?: string
  userId?: string
}

// Filter types
export interface CatalogueFilters {
  search: string
  categories: ResourceCategory[]
  conditions: ResourceCondition[]
  status: ResourceStatus[]
  sortBy: "newest" | "popular" | "rating" | "alphabetical"
}
