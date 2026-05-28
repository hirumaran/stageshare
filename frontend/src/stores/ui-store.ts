import { create } from "zustand"
import type { Notification, BorrowRequest, BorrowRequestStatus, Resource, User } from "@/types"
import { apiFetch } from "@/lib/api"

// ---------------------------------------------------------------------------
// Transform helpers
// ---------------------------------------------------------------------------

function mapNotification(backend: Record<string, unknown>): Notification {
  return {
    id: String(backend.id),
    type: (backend.type as Notification["type"]) ?? "borrow_request",
    title: (backend.title as string) ?? "",
    message: (backend.body as string) ?? "",
    read: Boolean(backend.is_read),
    createdAt: (backend.created_at as string) ?? "",
    actionUrl: (backend.link as string) ?? undefined,
  }
}

function mapBorrowRequest(backend: Record<string, unknown>): BorrowRequest {
  const stubResource: Resource = {
    id: String(backend.item_id ?? ""),
    title: (backend.item_name as string) ?? "",
    description: (backend.item_description as string) ?? "",
    category: "other",
    condition: "good",
    status: "available",
    images: backend.item_image_url ? [backend.item_image_url as string] : [],
    tags: [],
    ownerId: String(backend.owner_school_id ?? ""),
    owner: {
      id: "",
      email: "",
      name: [backend.owner_first_name, backend.owner_last_name].filter(Boolean).join(" ") || "",
      joinedAt: "",
      resourcesShared: 0,
      resourcesBorrowed: 0,
    },
    createdAt: "",
    updatedAt: "",
    borrowCount: 0,
    rating: 0,
    reviewCount: 0,
  }

  const stubBorrower: User = {
    id: String(backend.requester_id ?? ""),
    email: (backend.requester_email as string) ?? "",
    name: [backend.requester_first_name, backend.requester_last_name].filter(Boolean).join(" ") || "",
    joinedAt: "",
    resourcesShared: 0,
    resourcesBorrowed: 0,
    school: (backend.requester_school_name as string) ?? undefined,
    matrixUserId: (backend.requester_matrix_user_id as string) ?? undefined,
  }

  const stubOwner: User = {
    id: "",
    email: "",
    name: [backend.owner_first_name, backend.owner_last_name].filter(Boolean).join(" ") || "",
    joinedAt: "",
    resourcesShared: 0,
    resourcesBorrowed: 0,
    school: (backend.owner_school_name as string) ?? undefined,
    matrixUserId: (backend.owner_matrix_user_id as string) ?? undefined,
  }

  return {
    id: String(backend.id),
    resourceId: String(backend.item_id ?? ""),
    resource: stubResource,
    borrowerId: String(backend.requester_id ?? ""),
    borrower: stubBorrower,
    ownerId: String(backend.owner_school_id ?? ""),
    owner: stubOwner,
    status: (backend.status as BorrowRequestStatus) ?? "pending",
    requestedAt: (backend.created_at as string) ?? "",
    startDate: (backend.requested_date as string) ?? "",
    endDate: (backend.return_date as string) ?? "",
    returnedAt: (backend.returned_at as string) ?? undefined,
    message: (backend.requester_note as string) ?? undefined,
    ownerResponse: (backend.owner_note as string) ?? undefined,
    ownerMatrixUserId: (backend.owner_matrix_user_id as string) ?? undefined,
    matrixRoomId: (backend.matrix_room_id as string) ?? undefined,
  }
}

// ---------------------------------------------------------------------------
// Status → API transition endpoint
// ---------------------------------------------------------------------------

const TRANSITION_ENDPOINTS: Record<string, string> = {
  approved: "approve",
  rejected: "reject",
  cancelled: "cancel",
  active: "pickup",
  returned: "return",
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean

  // Notifications
  notifications: Notification[]
  unreadNotificationCount: number

  // Borrowing
  borrowRequests: BorrowRequest[]
  isLoadingRequests: boolean
  requestsError: string | null

  // Actions — sidebar
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Actions — notifications
  fetchNotifications: () => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>

  // Actions — borrow requests
  fetchBorrowRequests: () => Promise<void>
  fetchIncomingRequests: () => Promise<void>
  fetchOutgoingRequests: () => Promise<void>
  createBorrowRequest: (data: {
    itemId: string
    quantityRequested?: number
    requestedDate: string
    returnDate: string
    requesterNote?: string
  }) => Promise<BorrowRequest | null>
  updateBorrowRequest: (id: string, status: BorrowRequestStatus, response?: string) => Promise<void>
  setRequestMatrixRoomId: (id: string, matrixRoomId: string) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  notifications: [],
  unreadNotificationCount: 0,
  borrowRequests: [],
  isLoadingRequests: false,
  requestsError: null,

  // -----------------------------------------------------------------------
  // Sidebar
  // -----------------------------------------------------------------------

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }))
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open })
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed })
  },

  // -----------------------------------------------------------------------
  // Notifications
  // -----------------------------------------------------------------------

  fetchNotifications: async () => {
    try {
      const json = await apiFetch("/notifications")
      const notifications: Notification[] = (
        json.notifications as Record<string, unknown>[]
      ).map(mapNotification)
      const unreadNotificationCount = notifications.filter((n) => !n.read).length
      set({ notifications, unreadNotificationCount })
    } catch (err) {
      console.error("[UI] fetchNotifications failed:", err)
    }
  },

  markNotificationRead: async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH" })
      set((state) => {
        const notifications = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
        const unreadNotificationCount = notifications.filter((n) => !n.read).length
        return { notifications, unreadNotificationCount }
      })
    } catch (err) {
      console.error("[UI] markNotificationRead failed:", err)
    }
  },

  markAllNotificationsRead: async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" })
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadNotificationCount: 0,
      }))
    } catch (err) {
      console.error("[UI] markAllNotificationsRead failed:", err)
    }
  },

  // -----------------------------------------------------------------------
  // Borrow Requests
  // -----------------------------------------------------------------------

  fetchBorrowRequests: async () => {
    set({ isLoadingRequests: true, requestsError: null })
    try {
      const [incomingJson, outgoingJson] = await Promise.all([
        apiFetch("/requests/incoming"),
        apiFetch("/requests/outgoing"),
      ])
      const incoming: BorrowRequest[] = (incomingJson.data as Record<string, unknown>[]).map(mapBorrowRequest)
      const outgoing: BorrowRequest[] = (outgoingJson.data as Record<string, unknown>[]).map(mapBorrowRequest)
      set({ borrowRequests: [...incoming, ...outgoing], isLoadingRequests: false })
    } catch (err) {
      set({ isLoadingRequests: false, requestsError: (err as Error).message })
    }
  },

  fetchIncomingRequests: async () => {
    set({ isLoadingRequests: true, requestsError: null })
    try {
      const json = await apiFetch("/requests/incoming")
      const incoming: BorrowRequest[] = (json.data as Record<string, unknown>[]).map(mapBorrowRequest)
      const incomingIds = new Set(incoming.map((r) => r.id))
      const outgoing = get().borrowRequests.filter((r) => !incomingIds.has(r.id))
      set({ borrowRequests: [...incoming, ...outgoing], isLoadingRequests: false })
    } catch (err) {
      set({ isLoadingRequests: false, requestsError: (err as Error).message })
    }
  },

  fetchOutgoingRequests: async () => {
    set({ isLoadingRequests: true, requestsError: null })
    try {
      const json = await apiFetch("/requests/outgoing")
      const outgoing: BorrowRequest[] = (json.data as Record<string, unknown>[]).map(mapBorrowRequest)
      const outgoingIds = new Set(outgoing.map((r) => r.id))
      const incoming = get().borrowRequests.filter((r) => !outgoingIds.has(r.id))
      set({ borrowRequests: [...incoming, ...outgoing], isLoadingRequests: false })
    } catch (err) {
      set({ isLoadingRequests: false, requestsError: (err as Error).message })
    }
  },

  createBorrowRequest: async (data) => {
    set({ isLoadingRequests: true, requestsError: null })
    try {
      const json = await apiFetch("/requests", {
        method: "POST",
        body: JSON.stringify({
          itemId: parseInt(data.itemId, 10),
          quantityRequested: data.quantityRequested ?? 1,
          requestedDate: data.requestedDate,
          returnDate: data.returnDate,
          requesterNote: data.requesterNote ?? undefined,
        }),
      })
      const request = mapBorrowRequest(json as Record<string, unknown>)
      set((state) => ({
        borrowRequests: [...state.borrowRequests, request],
        isLoadingRequests: false,
      }))
      return request
    } catch (err) {
      set({ isLoadingRequests: false, requestsError: (err as Error).message })
      return null
    }
  },

  updateBorrowRequest: async (id, status, response) => {
    const endpoint = TRANSITION_ENDPOINTS[status]
    if (!endpoint) {
      console.error(`[UI] No transition endpoint for status: ${status}`)
      return
    }

    set({ isLoadingRequests: true, requestsError: null })
    try {
      const body: Record<string, string> = {}
      if (status === "rejected" && response) body.ownerNote = response
      if (status === "approved" && response) body.ownerNote = response

      const json = await apiFetch(`/requests/${id}/${endpoint}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      })
      const updated = mapBorrowRequest(json as Record<string, unknown>)

      set((state) => ({
        borrowRequests: state.borrowRequests.map((r) =>
          r.id === id ? updated : r
        ),
        isLoadingRequests: false,
      }))
    } catch (err) {
      set({ isLoadingRequests: false, requestsError: (err as Error).message })
      throw err
    }
  },

  setRequestMatrixRoomId: (id, matrixRoomId) => {
    set((state) => ({
      borrowRequests: state.borrowRequests.map((r) =>
        r.id === id ? { ...r, matrixRoomId } : r
      ),
    }))
  },
}))
