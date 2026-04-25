import { MessageSquareText } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background">
        <MessageSquareText className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Select a conversation</p>
        <p className="font-mono text-xs text-muted-foreground">
          $ messages --pick &lt;thread&gt;
        </p>
      </div>
    </div>
  )
}
