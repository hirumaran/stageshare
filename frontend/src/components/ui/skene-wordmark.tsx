import { cn } from "@/lib/utils"

const glyphs = {
  S: [
    "11111",
    "10000",
    "11110",
    "00001",
    "11110",
  ],
  K: [
    "10001",
    "10010",
    "11100",
    "10010",
    "10001",
  ],
  E: [
    "11111",
    "10000",
    "11110",
    "10000",
    "11111",
  ],
  N: [
    "10001",
    "11001",
    "10101",
    "10011",
    "10001",
  ],
} as const

const wordmark = [
  { glyph: "S", accented: false },
  { glyph: "K", accented: false },
  { glyph: "E", accented: true },
  { glyph: "N", accented: false },
  { glyph: "E", accented: true },
] as const

const dotRadius = 2.55
const dotPitch = 7
const glyphColumns = 5
const glyphWidth = dotRadius * 2 + (glyphColumns - 1) * dotPitch
const letterGap = 4
const viewBoxWidth =
  wordmark.length * glyphWidth + (wordmark.length - 1) * letterGap
const viewBoxHeight = dotRadius * 2 + 5 * dotPitch
const macron = "01110"

interface SkeneWordmarkProps {
  className?: string
}

export function SkeneWordmark({ className }: SkeneWordmarkProps) {
  return (
    <svg
      aria-label="Skēnē"
      className={cn("h-full w-full fill-current", className)}
      focusable="false"
      role="img"
      shapeRendering="geometricPrecision"
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
    >
      <title>Skēnē</title>
      {wordmark.flatMap((letter, letterIndex) => {
        const xOffset = letterIndex * (glyphWidth + letterGap)
        const rows = [
          letter.accented ? macron : "00000",
          ...glyphs[letter.glyph],
        ]

        return rows.flatMap((row, rowIndex) =>
          [...row].map((cell, columnIndex) => {
            if (cell !== "1") return null

            return (
              <circle
                key={`${letterIndex}-${rowIndex}-${columnIndex}`}
                cx={xOffset + dotRadius + columnIndex * dotPitch}
                cy={dotRadius + rowIndex * dotPitch}
                r={dotRadius}
              />
            )
          }),
        )
      })}
    </svg>
  )
}
