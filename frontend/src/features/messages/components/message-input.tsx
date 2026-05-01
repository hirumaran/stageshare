import { Image, Mic, Paperclip, SendHorizontal, Smile, Zap } from "lucide-react"
import { useEffect, useRef, useState, type KeyboardEvent } from "react"

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

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="shrink-0 border-t-[5px] border-black bg-[#fbfaf7] px-4 py-4 sm:px-8">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="mx-auto max-w-[1180px]"
      >
        <div className="border-[3px] border-black bg-white shadow-[7px_7px_0_#000]">
          <div className="flex min-h-[5.4rem] items-start">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={placeholder}
              disabled={disabled}
              aria-label="Type a message"
              className="scrollbar-hide max-h-40 min-h-[5.4rem] flex-1 resize-none bg-transparent px-5 py-4 text-base font-medium leading-relaxed text-black placeholder:text-[#6f7280] focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!value.trim() || disabled}
              className="m-3 grid h-14 min-w-14 place-items-center border-[3px] border-black bg-black px-4 text-white transition-colors hover:bg-[#ffc425] hover:text-black disabled:cursor-not-allowed disabled:bg-[#d8d6cf] disabled:text-black/35"
              aria-label="Send message"
              title="Send message"
            >
              <SendHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between border-t-[3px] border-black bg-[#f4f1ea] px-3 py-3">
            <div className="flex items-center gap-2">
              {[
                { label: "Attach file", icon: Paperclip },
                { label: "Add image", icon: Image },
                { label: "Voice note", icon: Mic },
                { label: "Emoji", icon: Smile },
              ].map((tool) => {
                const Icon = tool.icon

                return (
                  <button
                    key={tool.label}
                    type="button"
                    className="grid h-10 w-10 place-items-center border-2 border-black bg-white text-black transition-colors hover:bg-black hover:text-white"
                    aria-label={tool.label}
                    title={tool.label}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </button>
                )
              })}
            </div>

            <div className="hidden items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.16em] text-black/60 sm:flex">
              <Zap className="h-4 w-4 text-black" />
              Enter to send
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
