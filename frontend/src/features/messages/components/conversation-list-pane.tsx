import { ConversationListItem } from "./conversation-list-item"
import { SearchInput } from "./search-input"
import type { Conversation } from "../types"
import { Plus } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    <aside className="flex h-full w-full flex-col bg-[var(--bg-surface)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
            Messages
          </h2>
          {totalUnread > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[11px] font-semibold text-[var(--accent-text)]">
              {totalUnread}
            </span>
          )}
        </div>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--accent)] transition-colors hover:bg-[var(--border-strong)]"
          aria-label="New message"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 pb-3">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search"
        />
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="px-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">No conversations match</p>
          </div>
        ) : (
          <ul className="flex flex-col">
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
      </ScrollArea>
    </aside>
  )
}
