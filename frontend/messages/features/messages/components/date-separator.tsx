interface DateSeparatorProps {
  label: string
}

export function DateSeparator({ label }: DateSeparatorProps) {
  return (
    <div
      className="flex items-center justify-center py-3"
      role="separator"
      aria-label={label}
    >
      <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground shadow-sm">
        {label}
      </span>
    </div>
  )
}
