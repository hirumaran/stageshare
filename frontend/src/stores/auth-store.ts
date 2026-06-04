import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { User } from "@/types"
import { apiFetch } from "@/lib/api"
import { getConfig } from "@/lib/config"
import { useMatrixStore } from "./matrix-store"

// ---------------------------------------------------------------------------
// Storage adapter — configurable for React Native
// Web uses window.localStorage by default.
// React Native callers should call setAuthStorage(AsyncStorage) on app init.
// ---------------------------------------------------------------------------
type AuthStorageAdapter = {
  getItem: (key: string) => Promise<string | null> | string | null
  setItem: (key: string, value: string) => Promise<void> | void
  removeItem: (key: string) => Promise<void> | void
}

let storageAdapter: AuthStorageAdapter | null = null

const noopStorage: AuthStorageAdapter = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

function getAuthStorage() {
  if (storageAdapter) return storageAdapter
  if (typeof window !== "undefined") return window.localStorage
  return noopStorage
}

export function setAuthStorage(adapter: AuthStorageAdapter) {
  storageAdapter = adapter
  useAuthStore.persist.rehydrate()
}

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, name: string) => Promise<boolean>
  loadUser: () => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => void
  clearError: () => void
  setTokens: (token: string, refreshToken: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mapBackendUser(bu: Record<string, unknown>): User {
  return {
    id: String(bu.id),
    email: bu.email as string,
    name: bu.name as string,
    avatar: (bu.avatarUrl as string) ?? undefined,
    school: bu.schoolId != null ? String(bu.schoolId) : undefined,
    bio: (bu.bio as string) ?? undefined,
    joinedAt: (bu.createdAt as string) ?? new Date().toISOString(),
    resourcesShared: 0,
    resourcesBorrowed: 0,
    matrixUserId: (bu.matrixUserId as string) ?? undefined,
    matrixAccessToken: (bu.matrixAccessToken as string) ?? undefined,
    matrixDeviceId: (bu.matrixDeviceId as string) ?? undefined,
  }
}

async function bootMatrix(user: User) {
  if (user.matrixUserId && user.matrixAccessToken && user.matrixDeviceId) {
    useMatrixStore
      .getState()
      .initClient(user.matrixUserId, user.matrixAccessToken, user.matrixDeviceId)
      .catch((err) => console.error("[Auth] Matrix init failed:", err))
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const data = await apiFetch("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          })
          const user = mapBackendUser(data.user)
          set({
            user,
            token: data.token,
            refreshToken: data.refreshToken ?? null,
            isAuthenticated: true,
            isLoading: false,
          })
          bootMatrix(user)
          return true
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message })
          return false
        }
      },

      signup: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null })
        try {
          const nameParts = name.trim().split(" ")
          const firstName = nameParts[0]
          const lastName = nameParts.slice(1).join(" ") || firstName

          const data = await apiFetch("/auth/register", {
            method: "POST",
            body: JSON.stringify({ email, password, firstName, lastName }),
          })
          const user = mapBackendUser(data.user)
          set({
            user,
            token: data.token,
            refreshToken: data.refreshToken ?? null,
            isAuthenticated: true,
            isLoading: false,
          })
          bootMatrix(user)
          return true
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message })
          return false
        }
      },

      loadUser: async () => {
        const { token } = get()
        if (!token) return

        set({ isLoading: true })
        try {
          const data = await apiFetch("/auth/me")
          const user = mapBackendUser(data)
          set({ user, isAuthenticated: true, isLoading: false })
          bootMatrix(user)
        } catch {
          // Token is invalid/expired — clear auth state
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false })
        }
      },

      logout: async () => {
        const { refreshToken } = get()

        // Best-effort server-side revocation — do not block logout on failure
        if (refreshToken) {
          try {
            const BASE_URL = getConfig().apiBaseUrl
            await fetch(BASE_URL + "/auth/logout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            })
          } catch {
            // Ignore — local state is cleared regardless
          }
        }

        useMatrixStore.getState().stopClient()
        set({
          user: null,
          token: null,
          refreshToken: null,
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

      setTokens: (token: string, refreshToken: string) => {
        set({ token, refreshToken })
      },
    }),
    {
      name: "skene-auth",
      storage: createJSONStorage(() => ({
        getItem: (key: string) => {
          return getAuthStorage().getItem(key)
        },
        setItem: (key: string, value: string) => {
          return getAuthStorage().setItem(key, value)
        },
        removeItem: (key: string) => {
          return getAuthStorage().removeItem(key)
        },
      })),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
