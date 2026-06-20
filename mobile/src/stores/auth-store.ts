import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { User } from "@/types"
import { apiFetch } from "@/lib/api"
import { getConfig } from "@/lib/config"

const AUTH_STORAGE_KEY = "clio-auth"

// ---------------------------------------------------------------------------
// Storage adapter — REQUIRED on React Native.
//
// There is no `window.localStorage` on RN. Call setAuthStorage(adapter) at
// app startup, before this store is imported. The boot wiring in
// src/stores/index.ts installs a SecureStore-backed adapter.
// ---------------------------------------------------------------------------
type AuthStorageAdapter = {
  getItem: (key: string) => Promise<string | null> | string | null
  setItem: (key: string, value: string) => Promise<void> | void
  removeItem: (key: string) => Promise<void> | void
}

let storageAdapter: AuthStorageAdapter | null = null

function getAuthStorage(): AuthStorageAdapter {
  if (storageAdapter) return storageAdapter
  // Fail loudly — on RN, forgetting setAuthStorage() must not silently fall
  // back to a no-op store (the user would appear logged out across launches).
  throw new Error(
    "[auth-store] setAuthStorage(adapter) must be called before useAuthStore is used on React Native."
  )
}

export function setAuthStorage(adapter: AuthStorageAdapter) {
  storageAdapter = adapter
  console.log('[startup] setAuthStorage called, triggering rehydrate');
  try {
    void useAuthStore.persist.rehydrate()
  } catch (err) {
    console.error('[startup] rehydrate threw:', err)
  }
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
  signup: (email: string, password: string, name: string, emailVerifiedToken?: string) => Promise<boolean>
  loadUser: () => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => void
  clearError: () => void
  setTokens: (token: string, refreshToken: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return undefined
}

function field(record: Record<string, unknown>, key: string): string | undefined {
  return stringValue(record[key])
}

function getUserRecord(payload: unknown): Record<string, unknown> {
  const record = asRecord(payload)
  if (!record) throw new Error("Auth response was not an object.")

  const nestedUser = asRecord(record.user)
  return nestedUser ?? record
}

function getTokenPair(payload: unknown) {
  const record = asRecord(payload)
  if (!record) throw new Error("Login response was not an object.")

  const tokens = asRecord(record.tokens)
  const token =
    field(record, "token") ??
    field(record, "accessToken") ??
    field(record, "access_token") ??
    (tokens ? field(tokens, "token") ?? field(tokens, "accessToken") ?? field(tokens, "access_token") : undefined)
  const refreshToken =
    field(record, "refreshToken") ??
    field(record, "refresh_token") ??
    (tokens ? field(tokens, "refreshToken") ?? field(tokens, "refresh_token") : undefined)

  if (!token) throw new Error("Login response did not include an access token.")

  return { token, refreshToken: refreshToken ?? null }
}

function getSchoolName(bu: Record<string, unknown>): string | undefined {
  const school = asRecord(bu.school)
  return (
    field(bu, "schoolName") ??
    field(bu, "school") ??
    (school ? field(school, "name") ?? field(school, "id") : undefined) ??
    field(bu, "schoolId")
  )
}

function mapBackendUser(bu: Record<string, unknown>): User {
  const firstName = field(bu, "firstName")
  const lastName = field(bu, "lastName")
  const fallbackName = [firstName, lastName].filter(Boolean).join(" ")
  const displayName = field(bu, "name") ?? (fallbackName || field(bu, "email") || "")
  const schoolName = getSchoolName(bu)

  return {
    id: field(bu, "id") ?? "",
    email: field(bu, "email") ?? "",
    name: displayName,
    avatar: field(bu, "avatarUrl") ?? field(bu, "avatar"),
    school: schoolName,
    schoolName,
    role: field(bu, "role"),
    bio: field(bu, "bio"),
    joinedAt: field(bu, "createdAt") ?? new Date().toISOString(),
    resourcesShared: 0,
    resourcesBorrowed: 0,
    matrixUserId: field(bu, "matrixUserId"),
    matrixAccessToken: field(bu, "matrixAccessToken"),
    matrixDeviceId: field(bu, "matrixDeviceId"),
  }
}

// No-op for the current milestone — Matrix / push is intentionally out of
// scope. Kept as a function so the call sites stay stable and the wiring
// returns in a later milestone without touching the store.
function bootMatrix(_user: User) {
  /* Matrix is not started in this milestone. */
}

function persistAuthState(state: Partial<AuthState>) {
  return Promise.resolve(useAuthStore.setState(state))
}

async function clearPersistedAuthState(
  state: Pick<AuthState, "user" | "token" | "refreshToken" | "isAuthenticated" | "isLoading" | "error">
) {
  await persistAuthState(state)
  await Promise.resolve(getAuthStorage().removeItem(AUTH_STORAGE_KEY))
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
          const user = mapBackendUser(getUserRecord(data))
          const { token, refreshToken } = getTokenPair(data)
          await persistAuthState({
            user,
            token,
            refreshToken,
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

      signup: async (email: string, password: string, name: string, emailVerifiedToken?: string) => {
        set({ isLoading: true, error: null })
        try {
          const nameParts = name.trim().split(" ")
          const firstName = nameParts[0]
          const lastName = nameParts.slice(1).join(" ") || firstName

          const data = await apiFetch("/auth/register", {
            method: "POST",
            body: JSON.stringify({
              email,
              password,
              firstName,
              lastName,
              ...(emailVerifiedToken ? { emailVerifiedToken } : {}),
            }),
          })
          const user = mapBackendUser(getUserRecord(data))
          const { token, refreshToken } = getTokenPair(data)
          await persistAuthState({
            user,
            token,
            refreshToken,
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
          const user = mapBackendUser(getUserRecord(data))
          await persistAuthState({ user, isAuthenticated: true, isLoading: false })
          bootMatrix(user)
        } catch {
          // Token is invalid/expired — clear auth state
          await clearPersistedAuthState({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        }
      },

      logout: async () => {
        const { token, refreshToken } = get()

        // Best-effort server-side revocation — do not block logout on failure
        if (token || refreshToken) {
          try {
            const BASE_URL = getConfig().apiBaseUrl
            await fetch(BASE_URL + "/auth/logout", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
            })
          } catch {
            // Ignore — local state is cleared regardless
          }
        }

        await clearPersistedAuthState({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
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
      name: "clio-auth",
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
      skipHydration: true,
    }
  )
)
