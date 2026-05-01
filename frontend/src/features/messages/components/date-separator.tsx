interface DateSeparatorProps {
  label: string
}

export function DateSeparator({ label }: DateSeparatorProps) {
  return (
    <div className="my-8 flex items-center gap-4" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-black/25" />
      <span className="border-2 border-black bg-[#fbfaf7] px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.18em] text-black shadow-[3px_3px_0_#000]">
        {label}
      </span>
      <span className="h-px flex-1 bg-black/25" />
    </div>
  )
}
