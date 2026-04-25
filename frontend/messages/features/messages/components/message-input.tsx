"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUp, Paperclip, Smile } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageInputProps {
  onSend: (body: string) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({ onSend, disabled, placeholder = "Message" }: MessageInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize
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
    <div className="border-t border-border bg-background px-3 py-3 sm:px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className={cn(
          "flex items-end gap-1.5 rounded-2xl border border-border bg-background px-2 py-1.5 transition-colors",
          "focus-within:border-foreground/40 focus-within:shadow-sm",
        )}
      >
        <button
          type="button"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Attach file"
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
          aria-label="Message"
          aria-keyshortcuts="Enter"
          className="max-h-40 min-h-[28px] flex-1 resize-none bg-transparent px-1 py-1.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />

        <button
          type="button"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Insert emoji"
          title="Insert emoji"
        >
          <Smile className="h-4 w-4" />
        </button>

        <button
          type="submit"
          disabled={!canSend}
          title="Send · Enter"
          className={cn(
            "shrink-0 rounded-full p-1.5 transition-all",
            canSend
              ? "bg-foreground text-background shadow-sm hover:bg-foreground/90 active:scale-95"
              : "bg-muted text-muted-foreground",
          )}
          aria-label="Send message"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
