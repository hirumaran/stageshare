import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/types"
import { currentUser, mockUsers } from "@/data/mock-data"
import { useMatrixStore } from "./matrix-store"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, _password: string) => {
        set({ isLoading: true, error: null })

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800))

        // For demo: accept any password, find user by email or use current user
        const foundUser = mockUsers.find((u) => u.email === email) || currentUser

        set({
          user: foundUser,
          isAuthenticated: true,
          isLoading: false,
        })

        // Boot the Matrix client if this user has Matrix credentials
        if (
          foundUser.matrixUserId &&
          foundUser.matrixAccessToken &&
          foundUser.matrixDeviceId
        ) {
          useMatrixStore
            .getState()
            .initClient(
              foundUser.matrixUserId,
              foundUser.matrixAccessToken,
              foundUser.matrixDeviceId
            )
            .catch((err) =>
              console.error("[Auth] Matrix init failed:", err)
            )
        }

        return true
      },

      signup: async (email: string, _password: string, name: string) => {
        set({ isLoading: true, error: null })

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Create new user
        const newUser: User = {
          id: `user-${Date.now()}`,
          email,
          name,
          joinedAt: new Date().toISOString(),
          resourcesShared: 0,
          resourcesBorrowed: 0,
        }

        set({
          user: newUser,
          isAuthenticated: true,
          isLoading: false,
        })

        return true
      },

      logout: () => {
        useMatrixStore.getState().stopClient()
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        })
      },

      updateProfile: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }))
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: "stageshare-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
