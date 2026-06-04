/**
 * Matrix Store — manages the matrix-js-sdk client lifecycle.
 *
 * This store is the single source of truth for all messaging state.
 * It is initialized on login and torn down on logout.
 *
 * matrix-js-sdk reference:
 *   https://matrix-org.github.io/matrix-js-sdk/
 *
 * -------------------------------------------------------------------------
 * REACT NATIVE COMPATIBILITY NOTES
 *
 * Before using this store in React Native, the following must be resolved:
 *
 * 1. CRYPTO STORE: matrix-js-sdk uses IndexedDB for crypto persistence in browsers.
 *    In React Native, replace with:
 *    import { AsyncStorageCryptoStore } from '@matrix-org/matrix-sdk-crypto-wasm';
 *    or use react-native-mmkv backed store.
 *    Configure in initClient() where initRustCrypto() is called.
 *
 * 2. WASM: initRustCrypto() requires WebAssembly.
 *    In React Native, install: @matrix-org/matrix-sdk-crypto-wasm
 *    This requires a JSI-enabled build (Expo SDK 50+ or bare workflow).
 *
 * 3. CRYPTO POLYFILL: Install react-native-get-random-values and import
 *    it at the top of index.js (before any other imports):
 *    import 'react-native-get-random-values';
 *
 * 4. PERSISTENT SESSION: matrix_access_token is passed in from auth-store.
 *    On React Native, auth-store uses AsyncStorage (via setAuthStorage).
 *    The Matrix client must be re-initialized on every cold start from
 *    the stored credentials — bootMatrix() in auth-store handles this
 *    via loadUser() which is called on app init.
 *
 * 5. STORAGE ADAPTER: Pass AsyncStorage to matrix-js-sdk's createClient:
 *    storage: new IndexedDBStore({ indexedDB: asyncStorageAdapter })
 *    or use MemoryStore for MVP (messages don't persist across restarts).
 * -------------------------------------------------------------------------
 */

import { create } from "zustand"
import * as sdk from "matrix-js-sdk"
import type { MatrixClient, Room, MatrixEvent } from "matrix-js-sdk"
import {
  ClientEvent,
  RoomEvent,
  EventType,
  MsgType,
  Preset,
} from "matrix-js-sdk"
import type { MatrixConversation, MatrixMessage } from "@/types"
import { getConfig } from "@/lib/config"

interface MatrixStore {
  client: MatrixClient | null
  conversations: MatrixConversation[]
  activeRoomId: string | null
  messages: Record<string, MatrixMessage[]>
  isReady: boolean
  isSyncing: boolean
  error: string | null

  // Actions
  initClient: (
    userId: string,
    accessToken: string,
    deviceId: string
  ) => Promise<void>
  stopClient: () => void
  setActiveRoom: (roomId: string) => void
  sendMessage: (roomId: string, content: string) => Promise<void>
  createOrGetDMRoom: (targetMatrixUserId: string) => Promise<string>
  loadMessagesForRoom: (roomId: string) => void
  getUnreadCount: () => number
}

function roomToConversation(
  room: Room,
  myUserId: string
): MatrixConversation {
  const otherMembers = room
    .getJoinedMembers()
    .filter((m) => m.userId !== myUserId)
  const otherMember = otherMembers[0]
  const name = otherMember?.name ?? room.name ?? "Unknown"
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const timeline = room.getLiveTimeline().getEvents()
  const lastMsgEvt = [...timeline]
    .reverse()
    .find((e) => e.getType() === EventType.RoomMessage)
  const lastMessage = lastMsgEvt?.getContent()?.body ?? ""
  const lastAt = lastMsgEvt ? new Date(lastMsgEvt.getTs()) : null

  const notifCount = room.getUnreadNotificationCount()

  return {
    roomId: room.roomId,
    name,
    avatarInitials: initials,
    schoolName: "",
    lastMessage,
    lastMessageAt: lastAt,
    unreadCount: notifCount,
    isDM: true,
  }
}

/**
 * Cross-platform UUID generator.
 * Works in browser, Node, and React Native (with react-native-get-random-values polyfill).
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function eventToMessage(
  event: MatrixEvent,
  myUserId: string
): MatrixMessage | null {
  if (event.getType() !== EventType.RoomMessage) return null
  const content = event.getContent()
  if (!content?.body) return null

  return {
    id: event.getId() ?? generateId(),
    roomId: event.getRoomId() ?? "",
    senderId: event.getSender() ?? "",
    senderName:
      event.getSender()?.split(":")[0].replace("@", "") ?? "Unknown",
    content: content.body,
    timestamp: new Date(event.getTs()),
    isMe: event.getSender() === myUserId,
    type: "text",
  }
}

export const useMatrixStore = create<MatrixStore>((set, get) => ({
  client: null,
  conversations: [],
  activeRoomId: null,
  messages: {},
  isReady: false,
  isSyncing: false,
  error: null,

  initClient: async (userId, accessToken, deviceId) => {
    if (get().client) return

    set({ isSyncing: true, error: null })

    try {
      const client = sdk.createClient({
        baseUrl: getConfig().matrixHomeserverUrl,
        userId,
        accessToken,
        deviceId,
      })

      // Try to initialize Rust-backed E2EE; fall back to legacy or none
      try {
        await client.initRustCrypto()
      } catch (cryptoErr) {
        console.warn(
          "[Matrix] Rust crypto init failed, falling back to legacy crypto:",
          cryptoErr
        )
        try {
          await (client as any).initCrypto()
        } catch (legacyErr) {
          console.warn(
            "[Matrix] Legacy crypto init failed, running without E2EE:",
            legacyErr
          )
        }
      }

      // Auto-accept invites to DM rooms
      client.on(sdk.RoomMemberEvent.Membership, async (_event, member) => {
        if (member.membership === "invite" && member.userId === userId) {
          try {
            await client.joinRoom(member.roomId)
          } catch (e) {
            console.warn("[Matrix] Failed to auto-join room:", e)
          }
        }
      })

      // Rebuild conversations list on any room timeline event
      client.on(
        RoomEvent.Timeline,
        (_event: MatrixEvent, room: Room | undefined) => {
          if (!room) return
          const myId = client.getUserId() ?? ""

          const msgs = room
            .getLiveTimeline()
            .getEvents()
            .map((e) => eventToMessage(e, myId))
            .filter((m): m is MatrixMessage => m !== null)

          set((state) => ({
            messages: { ...state.messages, [room.roomId]: msgs },
            conversations: client
              .getRooms()
              .map((r) => roomToConversation(r, myId)),
          }))
        }
      )

      // When initial sync completes, populate state
      client.on(ClientEvent.Sync, (state: string) => {
        if (state === "PREPARED") {
          const myId = client.getUserId() ?? ""
          const rooms = client.getRooms()
          const conversations = rooms.map((r) =>
            roomToConversation(r, myId)
          )

          const messages: Record<string, MatrixMessage[]> = {}
          for (const room of rooms) {
            messages[room.roomId] = room
              .getLiveTimeline()
              .getEvents()
              .map((e) => eventToMessage(e, myId))
              .filter((m): m is MatrixMessage => m !== null)
          }

          set({
            isReady: true,
            isSyncing: false,
            conversations,
            messages,
          })
        }
        if (state === "ERROR") {
          set({
            isSyncing: false,
            error: "Failed to sync with chat server",
          })
        }
      })

      await client.startClient({
        initialSyncLimit: 30,
        lazyLoadMembers: true,
      })

      set({ client })
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Matrix init failed"
      console.error("[Matrix] Init error:", err)
      set({ error: msg, isSyncing: false })
    }
  },

  stopClient: () => {
    const { client } = get()
    if (client) {
      client.stopClient()
      client.removeAllListeners()
    }
    set({
      client: null,
      isReady: false,
      isSyncing: false,
      conversations: [],
      messages: {},
      activeRoomId: null,
      error: null,
    })
  },

  setActiveRoom: (roomId) => {
    set({ activeRoomId: roomId })
    const { client } = get()
    if (client) {
      const room = client.getRoom(roomId)
      if (room) {
        const lastEvent = room.getLiveTimeline().getEvents().slice(-1)[0]
        if (lastEvent) {
          client.sendReadReceipt(lastEvent).catch(console.warn)
        }
      }
    }
  },

  sendMessage: async (roomId, content) => {
    const { client } = get()
    if (!client || !content.trim()) return
    await client.sendTextMessage(roomId, content.trim())
  },

  createOrGetDMRoom: async (targetMatrixUserId) => {
    const { client } = get()
    if (!client) throw new Error("Matrix client not initialized")

    const myId = client.getUserId() ?? ""

    const existingRoom = client.getRooms().find((room) => {
      const members = room.getJoinedMembers()
      return (
        members.length === 2 &&
        members.some((m) => m.userId === targetMatrixUserId) &&
        members.some((m) => m.userId === myId)
      )
    })

    if (existingRoom) return existingRoom.roomId

    const result = await client.createRoom({
      invite: [targetMatrixUserId],
      is_direct: true,
      preset: Preset.TrustedPrivateChat as any,
      initial_state: [
        {
          type: "m.room.encryption",
          state_key: "",
          content: { algorithm: "m.megolm.v1.aes-sha2" },
        },
      ],
    })

    const dmRooms =
      (client.getAccountData("m.direct" as any)?.getContent() as any) ?? {}
    dmRooms[targetMatrixUserId] = [
      ...(dmRooms[targetMatrixUserId] ?? []),
      result.room_id,
    ]
    await client.setAccountData("m.direct" as any, dmRooms)

    return result.room_id
  },

  loadMessagesForRoom: (roomId) => {
    const { client, messages } = get()
    if (!client) return

    const room = client.getRoom(roomId)
    if (!room) return

    const myId = client.getUserId() ?? ""
    const msgs = room
      .getLiveTimeline()
      .getEvents()
      .map((e) => eventToMessage(e, myId))
      .filter((m): m is MatrixMessage => m !== null)

    set({ messages: { ...messages, [roomId]: msgs } })
  },

  getUnreadCount: () => {
    return get().conversations.reduce((sum, c) => sum + c.unreadCount, 0)
  },
}))
