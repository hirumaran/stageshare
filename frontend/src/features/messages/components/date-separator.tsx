interface DateSeparatorProps {
  label: string
}

export function DateSeparator({ label }: DateSeparatorProps) {
  return (
    <div className="flex justify-center my-6" role="separator" aria-label={label}>
      <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400 font-medium tracking-wide">
        {label}
      </span>
    </div>
  )
}
