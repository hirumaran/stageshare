import { cn } from "@/lib/utils"

type StatusDotTone = "borrow_request" | "approved" | "message" | "alert"

const dotToneClass: Record<StatusDotTone, string> = {
  borrow_request: "bg-[var(--gold)]",
  approved: "bg-[var(--status-success)]",
  message: "bg-[var(--text-muted)]",
  alert: "bg-[var(--status-error)]",
}

interface StatusDotProps {
  tone: StatusDotTone
  className?: string
}

export function StatusDot({ tone, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "block h-1.5 w-1.5 shrink-0 rounded-full",
        dotToneClass[tone],
        className,
      )}
      aria-hidden="true"
    />
  )
}
