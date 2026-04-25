interface DateSeparatorProps {
  label: string
}

export function DateSeparator({ label }: DateSeparatorProps) {
  return (
    <div
      className="flex items-center gap-3 py-4"
      role="separator"
      aria-label={label}
    >
      <div className="h-px flex-1 bg-border/50" />
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  )
}
