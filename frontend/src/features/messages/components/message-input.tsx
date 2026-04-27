import { cn } from "@/lib/utils"
import { Send, Image, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface MessageInputProps {
  onSend: (body: string) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({ onSend, disabled, placeholder = "Message" }: MessageInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="shrink-0 border-t border-white/5 bg-[var(--bg-base)] px-3 py-2.5">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="mx-auto flex max-w-2xl items-end gap-2"
      >
        <button
          type="button"
          className="shrink-0 rounded-full p-2 text-muted-foreground/60 transition-colors hover:bg-[var(--bg-muted)]/50 hover:text-[var(--accent)]"
          title="Gallery"
        >
          <Image className="h-5 w-5" />
        </button>

        <div className="flex flex-1 items-end gap-1 rounded-full border border-border/20 bg-[var(--bg-muted)]/40 px-3 py-2 transition-colors focus-within:bg-[var(--bg-muted)]/60">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={placeholder}
            disabled={disabled}
            aria-label="Type a message"
            className="max-h-40 min-h-[24px] flex-1 resize-none bg-transparent px-0 py-0 text-[14px] leading-snug text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus-visible:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />

          <button
            type="button"
            className="shrink-0 rounded-full p-1 text-muted-foreground/50 transition-colors hover:bg-[var(--bg-muted)]/50 hover:text-[var(--accent)]"
            title="More"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!canSend}
          title="Send"
          className={cn(
            "shrink-0 rounded-full p-2.5 transition-all",
            canSend
              ? "bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 active:scale-95 shadow-sm"
              : "text-muted-foreground/20 cursor-default",
          )}
          aria-label="Send"
        >
          <Send className={cn("h-4 w-4", canSend && "-rotate-45")} />
        </button>
      </form>
    </div>
  )
}
