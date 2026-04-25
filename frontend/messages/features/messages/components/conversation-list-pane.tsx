"use client"

import { ConversationListItem } from "./conversation-list-item"
import { SearchInput } from "./search-input"
import type { Conversation } from "../types"
import { SquarePen } from "lucide-react"

interface ConversationListPaneProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelect: (id: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  totalUnread: number
}

export function ConversationListPane({
  conversations,
  activeConversationId,
  onSelect,
  searchQuery,
  onSearchChange,
  totalUnread,
}: ConversationListPaneProps) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-background md:w-80 lg:w-96">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Messages</h2>
            {totalUnread > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 font-mono text-[10px] font-medium text-background">
                {totalUnread}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="New message"
          >
            <SquarePen className="h-4 w-4" />
          </button>
        </div>
        <SearchInput value={searchQuery} onChange={onSearchChange} placeholder="Search conversations" />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="px-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">No conversations match</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground/70">&quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {conversations.map((c) => (
              <li key={c.id}>
                <ConversationListItem
                  conversation={c}
                  active={c.id === activeConversationId}
                  onClick={() => onSelect(c.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
