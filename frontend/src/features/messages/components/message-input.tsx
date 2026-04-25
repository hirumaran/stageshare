import { cn } from "@/lib/utils"
import { Send, Paperclip, Smile } from "lucide-react"
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
    <div className="shrink-0 border-t border-border bg-[var(--bg-subtle)] px-3 py-3 sm:px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-[var(--bg-surface)] p-2 px-3 transition-shadow focus-within:border-ring focus-within:shadow-sm focus-within:ring-1 focus-within:ring-ring/30"
      >
        <button
          type="button"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Type a message"
          className="max-h-40 min-h-[28px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />

        <button
          type="button"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Insert emoji"
        >
          <Smile className="h-4 w-4" />
        </button>

        <button
          type="submit"
          disabled={!canSend}
          title="Send · Enter"
          className={cn(
            "shrink-0 rounded-full p-2 transition-all",
            canSend
              ? "bg-[var(--accent)] text-[var(--accent-text)] shadow-sm hover:opacity-90 active:scale-95"
              : "bg-muted text-muted-foreground cursor-default opacity-70",
          )}
          aria-label="Send"
        >
          <Send className={cn("h-4 w-4", canSend && "-rotate-45")} />
        </button>
      </form>
    </div>
  )
}
