import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = "Search", className }: SearchInputProps) {
  return (
    <div
      className={cn(
        "group flex h-14 items-center gap-3 border-[3px] border-black bg-white px-4 shadow-[4px_4px_0_#000] transition-transform focus-within:-translate-y-0.5",
        className,
      )}
    >
      <Search className="h-5 w-5 shrink-0 text-black" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-full w-full bg-transparent text-[0.95rem] font-medium text-black placeholder:text-[#6f7280] focus:outline-none"
        aria-label={placeholder}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="grid h-7 w-7 place-items-center border-2 border-black bg-[#ffc425] text-black transition-colors hover:bg-black hover:text-white"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
