import {
  ArrowLeft,
  CalendarDays,
  MoreHorizontal,
  PackageCheck,
  Sparkles,
  Video,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Conversation } from "../types"
import { getAvatarPalette, getInitials } from "../lib/avatar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ChatHeaderProps {
  conversation: Conversation
  onBack?: () => void
}

export function ChatHeader({ conversation, onBack }: ChatHeaderProps) {
  const counterpart =
    conversation.participants.find((p) => p.id === conversation.counterpartId) ??
    conversation.participants[0]
  const presence = counterpart?.presence ?? "offline"
  const palette = getAvatarPalette(counterpart?.id ?? conversation.id)
  const initials = getInitials(counterpart?.name ?? conversation.title)

  const presenceConfig =
    presence === "online"
      ? { label: "Active now", dot: "bg-[#35c76f]" }
      : presence === "away"
        ? { label: "Away", dot: "bg-[#ffc425]" }
        : { label: "Offline", dot: "bg-[#9a9a9a]" }

  return (
    <header className="relative shrink-0 border-b-[5px] border-black bg-[#fbfaf7]">
      <div className="flex min-h-[8.5rem] items-stretch">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="grid w-16 shrink-0 place-items-center border-r-[4px] border-black bg-white text-black transition-colors hover:bg-black hover:text-white md:hidden"
            aria-label="Back to conversations"
            title="Back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col justify-center px-5 py-5 sm:px-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 border-2 border-black bg-[#ffc425] px-2.5 py-1 text-[0.66rem] font-black uppercase tracking-[0.16em]">
              <span className={cn("h-2.5 w-2.5 border border-black", presenceConfig.dot)} />
              {presenceConfig.label}
            </span>
            <span className="hidden border-2 border-black bg-white px-2.5 py-1 text-[0.66rem] font-black uppercase tracking-[0.16em] sm:inline-flex">
              {conversation.participants.length} people
            </span>
            {conversation.resource ? (
              <span className="inline-flex max-w-full items-center gap-1.5 border-2 border-black bg-[#e9e6dc] px-2.5 py-1 text-[0.66rem] font-black uppercase tracking-[0.12em]">
                <PackageCheck className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{conversation.resource.category}</span>
              </span>
            ) : null}
          </div>

          <div className="flex min-w-0 items-end gap-4">
            <Avatar className="hidden h-16 w-16 rounded-none border-[3px] border-black bg-white sm:flex">
              <AvatarImage
                src={counterpart?.avatar}
                alt={counterpart?.name ?? conversation.title}
                className="object-cover grayscale"
              />
              <AvatarFallback
                className={cn("rounded-none text-base font-black", palette.bg, palette.text)}
              >
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-black/65">
                Conversation
              </p>
              <h1 className="truncate text-[clamp(2.2rem,5.8vw,5rem)] font-black uppercase leading-[0.88] text-black">
                {conversation.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="hidden w-[19rem] shrink-0 border-l-[4px] border-black bg-[#e9e6dc] p-4 xl:block">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[0.66rem] font-black uppercase tracking-[0.16em]">
              Active prop line
            </span>
            <Sparkles className="h-4 w-4" />
          </div>
          <p className="line-clamp-2 text-xl font-black leading-tight text-black">
            {conversation.resource?.title ?? "Open collaboration thread"}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[0.62rem] font-black uppercase tracking-[0.12em]">
            <span className="border-2 border-black bg-white px-2 py-2 text-center">
              pickup
            </span>
            <span className="border-2 border-black bg-white px-2 py-2 text-center">
              sizing
            </span>
          </div>
        </div>

        <div className="flex w-16 shrink-0 flex-col border-l-[4px] border-black sm:w-[4.75rem]">
          {[
            { label: "Video call", icon: Video },
            { label: "Schedule", icon: CalendarDays },
            { label: "Details", icon: MoreHorizontal },
          ].map((action) => {
            const Icon = action.icon

            return (
              <button
                key={action.label}
                type="button"
                className="grid flex-1 place-items-center border-b-[4px] border-black bg-white text-black transition-colors last:border-b-0 hover:bg-black hover:text-white"
                aria-label={action.label}
                title={action.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
