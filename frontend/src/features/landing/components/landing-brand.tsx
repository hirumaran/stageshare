/* Clio brand mark — a proscenium arch (the theatre stage opening) with a
   single ember stage-light at its apex. Geometric, flat, monochrome + accent. */
export function Mark({
  size = 26,
  className = "",
  onDark = false,
}: {
  size?: number
  className?: string
  onDark?: boolean
}) {
  const ink = onDark ? "var(--primary-foreground)" : "var(--foreground)"
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* proscenium arch — open stage mouth */}
      <path
        d="M5 28V14a11 11 0 0 1 22 0v14"
        stroke={ink}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* stage floor line */}
      <path d="M3.5 28h25" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />
      {/* ember spotlight at the apex */}
      <circle cx="16" cy="9.5" r="3" fill="var(--ember)" />
    </svg>
  )
}

export function Wordmark({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <Mark onDark={onDark} />
      <span
        className="text-[19px] font-semibold tracking-[-0.04em]"
        style={{ color: onDark ? "var(--primary-foreground)" : "var(--foreground)" }}
      >
        Clio
      </span>
    </span>
  )
}
