import { useId } from "react"
import { cn } from "@/lib/utils"

interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  x?: number
  y?: number
  cx?: number
  cy?: number
  cr?: number
  className?: string
}

/**
 * DotPattern — a tiling SVG dot grid for section/page backgrounds.
 * `fill` is inherited by the dots, so set the color via the `className`
 * (e.g. `fill-neutral-400/60`) and fade it with a CSS `mask-image`.
 */
export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  ...props
}: DotPatternProps) {
  const id = useId()

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-neutral-400/80",
        className
      )}
      {...props}
    >
      <pattern
        id={id}
        width={width}
        height={height}
        patternUnits="userSpaceOnUse"
        patternContentUnits="userSpaceOnUse"
        x={x}
        y={y}
      >
        <circle id="pattern-circle" cx={cx} cy={cy} r={cr} />
      </pattern>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  )
}

export default DotPattern
