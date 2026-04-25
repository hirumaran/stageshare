import { create } from "zustand"
import type { Notification, BorrowRequest } from "@/types"
import { mockNotifications, mockBorrowRequests } from "@/data/mock-data"

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean

  // Notifications
  notifications: Notification[]
  unreadNotificationCount: number

  // Borrowing
  borrowRequests: BorrowRequest[]

  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Notification actions
  fetchNotifications: () => Promise<void>
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  // Borrowing actions
  fetchBorrowRequests: () => Promise<void>
  updateBorrowRequest: (id: string, status: BorrowRequest["status"], response?: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  notifications: [],
  unreadNotificationCount: 0,
  borrowRequests: [],

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }))
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open })
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed })
  },

  fetchNotifications: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const notifications = mockNotifications
    const unreadNotificationCount = notifications.filter((n) => !n.read).length
    set({ notifications, unreadNotificationCount })
  },

  markNotificationRead: (id) => {
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
      const unreadNotificationCount = notifications.filter((n) => !n.read).length
      return { notifications, unreadNotificationCount }
    })
  },

  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadNotificationCount: 0,
    }))
  },

  fetchBorrowRequests: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    set({ borrowRequests: mockBorrowRequests })
  },

  updateBorrowRequest: (id, status, response) => {
    set((state) => ({
      borrowRequests: state.borrowRequests.map((r) =>
        r.id === id
          ? { ...r, status, ownerResponse: response }
          : r
      ),
    }))
  },
}))
