import { MessageSquareText } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted">
        <MessageSquareText className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <p className="font-display text-base font-medium text-foreground">Select a conversation</p>
        <p className="text-sm text-muted-foreground max-w-[240px]">
          Choose someone from your list to start messaging
        </p>
      </div>
    </div>
  )
}
