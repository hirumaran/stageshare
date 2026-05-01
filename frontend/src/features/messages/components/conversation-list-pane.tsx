import { ConversationListItem } from "./conversation-list-item"
import { SearchInput } from "./search-input"
import type { Conversation } from "../types"
import { MessageCirclePlus, Radio, Sparkles } from "lucide-react"
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
    <aside className="flex h-full w-full flex-col bg-[#fbfaf7]">
      <div className="border-b-[4px] border-black px-5 py-5">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border-2 border-black bg-white px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em]">
              <Radio className="h-3.5 w-3.5" />
              Live chatter
            </div>
            <h2 className="text-[clamp(2.35rem,4.5vw,4.3rem)] font-black uppercase leading-[0.82] text-black">
              Messages
            </h2>
          </div>
          <button
            type="button"
            className="group grid h-14 w-14 shrink-0 place-items-center border-[3px] border-black bg-[#ffc425] text-black shadow-[4px_4px_0_#000] transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf7]"
            aria-label="Start new chat"
            title="Start new chat"
          >
            <MessageCirclePlus className="h-6 w-6 transition-transform group-hover:rotate-6" />
          </button>
        </div>

        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Find a person, prop, pickup..."
        />

        <div className="mt-4 grid grid-cols-3 gap-2 text-[0.66rem] font-black uppercase tracking-[0.12em]">
          <span className="border-2 border-black bg-black px-2 py-2 text-center text-white">
            All chats
          </span>
          <span className="border-2 border-black bg-white px-2 py-2 text-center">
            Fittings
          </span>
          <span className="border-2 border-black bg-white px-2 py-2 text-center">
            Hand-offs
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-2 border-black bg-[#e9e6dc] px-3 py-2 text-xs font-black uppercase tracking-[0.12em]">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Costume comms
          </span>
          <span className="bg-black px-2 py-1 text-white">{totalUnread} new</span>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {conversations.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center border-[3px] border-black bg-[#ffc425] shadow-[4px_4px_0_#000]">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.12em] text-black">
              No chats match
            </p>
          </div>
        ) : (
          <ul className="flex flex-col border-t-[4px] border-black">
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
