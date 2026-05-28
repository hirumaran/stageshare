import { useMemo } from "react"
import { useMatrixStore } from "@/stores/matrix-store"
import { mapMatrixMessage } from "../lib/matrix-adapter"
import type { Message } from "../types"

export interface MessageGroup {
  dayKey: string
  label: string
  messages: Message[]
}

function dayKeyOf(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function dayLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDay.getTime()) / (24 * 60 * 60 * 1000)
  )
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: "long" })
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function useMessages(conversationId: string | null) {
  const matrixMessages = useMatrixStore((s) => s.messages)

  const messages = useMemo((): Message[] => {
    if (!conversationId) return []
    const msgs = matrixMessages[conversationId] ?? []
    return msgs.map((m) => mapMatrixMessage(m))
  }, [matrixMessages, conversationId])

  const grouped = useMemo(() => {
    if (!messages.length) return []
    const groups: MessageGroup[] = []
    for (const m of messages) {
      const key = dayKeyOf(m.sentAt)
      const existing = groups[groups.length - 1]
      if (existing && existing.dayKey === key) {
        existing.messages.push(m)
      } else {
        groups.push({
          dayKey: key,
          label: dayLabel(m.sentAt),
          messages: [m],
        })
      }
    }
    return groups
  }, [messages])

  return { messages, grouped }
}
