import React, { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export type DitherPattern =
  | "dots"
  | "ripple"
  | "simplex"
  | "sphere"
  | "swirl"
  | "warp"
  | "wave"

type AnimatedDitherBackgroundProps = {
  pattern?: DitherPattern
  foregroundColor?: string
  secondaryColor?: string
  primaryColor?: string
  backgroundColor?: string
  speed?: number
  pixelSize?: number
  scale?: number
  rotation?: number
  opacity?: number
  className?: string
  style?: React.CSSProperties
}

type PropertyControl =
  | {
      type: "enum"
      title?: string
      options: string[]
      optionTitles?: string[]
    }
  | {
      type: "color"
      title?: string
    }
  | {
      type: "number"
      title?: string
      min?: number
      max?: number
      step?: number
      displayStepper?: boolean
    }

type PropertyControls = Record<string, PropertyControl>

const ControlType = {
  Enum: "enum",
  Color: "color",
  Number: "number",
} as const

function addPropertyControls(
  component: React.ComponentType<AnimatedDitherBackgroundProps>,
  controls: PropertyControls,
) {
  ;(component as React.ComponentType<AnimatedDitherBackgroundProps> & {
    propertyControls?: PropertyControls
  }).propertyControls = controls
}

const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

const parseHexColor = (color: string) => {
  const normalized = color.replace("#", "")
  const value = Number.parseInt(
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized,
    16,
  )

  if (Number.isNaN(value)) {
    return { r: 125, g: 134, b: 255 }
  }

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

const mixColor = (
  primary: ReturnType<typeof parseHexColor>,
  secondary: ReturnType<typeof parseHexColor>,
  amount: number,
) => {
  const { r, g, b } = mixRgb(primary, secondary, amount)

  return `rgb(${r}, ${g}, ${b})`
}

const mixRgb = (
  primary: ReturnType<typeof parseHexColor>,
  secondary: ReturnType<typeof parseHexColor>,
  amount: number,
) => {
  const mix = clamp01(amount)

  return {
    r: Math.round(primary.r + (secondary.r - primary.r) * mix),
    g: Math.round(primary.g + (secondary.g - primary.g) * mix),
    b: Math.round(primary.b + (secondary.b - primary.b) * mix),
  }
}

const mixNumber = (from: number, to: number, amount: number) =>
  from + (to - from) * clamp01(amount)

const hashNoise = (x: number, y: number, seed: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123
  return n - Math.floor(n)
}

const smoothstep = (value: number) => value * value * (3 - 2 * value)

const valueNoise = (x: number, y: number, seed: number) => {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const xf = x - x0
  const yf = y - y0
  const topLeft = hashNoise(x0, y0, seed)
  const topRight = hashNoise(x0 + 1, y0, seed)
  const bottomLeft = hashNoise(x0, y0 + 1, seed)
  const bottomRight = hashNoise(x0 + 1, y0 + 1, seed)
  const u = smoothstep(xf)
  const v = smoothstep(yf)
  const top = topLeft + (topRight - topLeft) * u
  const bottom = bottomLeft + (bottomRight - bottomLeft) * u

  return top + (bottom - top) * v
}

const samplePattern = (
  pattern: DitherPattern,
  x: number,
  y: number,
  t: number,
) => {
  const radius = Math.hypot(x, y)
  const angle = Math.atan2(y, x)

  switch (pattern) {
    case "dots": {
      const dotGrid = Math.cos(x * 18 + t) * Math.cos(y * 18 - t * 0.6)
      return clamp01(0.5 + dotGrid * 0.45)
    }
    case "ripple":
      return clamp01(0.5 + Math.sin(radius * 22 - t * 2.2) * 0.5)
    case "simplex": {
      const octaveA = valueNoise(x * 4 + t * 0.45, y * 4 - t * 0.35, 1)
      const octaveB = valueNoise(x * 9 - t * 0.25, y * 9 + t * 0.2, 4)
      const octaveC = valueNoise(x * 18 + t * 0.1, y * 18 - t * 0.15, 9)
      return clamp01(octaveA * 0.58 + octaveB * 0.28 + octaveC * 0.14)
    }
    case "wave":
      return clamp01(
        0.5 +
          Math.sin(x * 9 + t * 1.4) * 0.28 +
          Math.cos(y * 7 - t * 0.9) * 0.22,
      )
    case "swirl":
      return clamp01(0.5 + Math.sin(radius * 16 + angle * 6 + t * 1.25) * 0.5)
    case "warp": {
      const warpedX = x + Math.sin(y * 5 + t) * 0.22
      const warpedY = y + Math.cos(x * 4 - t * 0.8) * 0.18
      return clamp01(
        0.5 +
          Math.sin(warpedX * 10 + t) * 0.28 +
          Math.cos(warpedY * 12 - t * 0.6) * 0.28,
      )
    }
    case "sphere": {
      if (radius > 0.96) {
        return clamp01(0.2 + Math.sin(radius * 24 - t) * 0.08)
      }
      const z = Math.sqrt(1 - radius * radius)
      const light = x * -0.28 + y * -0.38 + z * 0.78
      return clamp01(0.32 + light * 0.7 + Math.sin(angle * 12 + t) * 0.06)
    }
    default: {
      return clamp01(0.5 + Math.sin(x * 9 + t * 1.4) * 0.28)
    }
  }
}

export function AnimatedDitherBackground({
  pattern = "warp",
  foregroundColor,
  secondaryColor = "#5e6cff",
  primaryColor = "#7d86ff",
  backgroundColor = "transparent",
  speed = 0.55,
  pixelSize = 8,
  scale = 1,
  rotation = 0,
  opacity = 0.22,
  className,
  style,
}: AnimatedDitherBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const resolvedForegroundColor = foregroundColor ?? primaryColor
  const previousFrameRef = useRef({
    pattern,
    foregroundColor: resolvedForegroundColor,
    secondaryColor,
    backgroundColor,
    opacity,
  })
  const transitionStartRef = useRef<number | null>(null)
  const currentFrame = {
    pattern,
    foregroundColor: resolvedForegroundColor,
    secondaryColor,
    backgroundColor,
    opacity,
  }
  const previousFrame = previousFrameRef.current

  if (
    transitionStartRef.current === null &&
    (previousFrame.pattern !== currentFrame.pattern ||
      previousFrame.foregroundColor !== currentFrame.foregroundColor ||
      previousFrame.secondaryColor !== currentFrame.secondaryColor ||
      previousFrame.backgroundColor !== currentFrame.backgroundColor ||
      previousFrame.opacity !== currentFrame.opacity)
  ) {
    transitionStartRef.current = performance.now()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    const context = canvas?.getContext("2d", { alpha: true })

    if (!canvas || !parent || !context) return

    let animationId = 0
    let width = 0
    let height = 0
    let dpr = 1
    const safePixelSize = Math.max(2, pixelSize)
    const safeScale = Math.max(0.1, scale)
    const currentPrimaryRgb = parseHexColor(resolvedForegroundColor)
    const currentSecondaryRgb = parseHexColor(secondaryColor)
    const currentBackgroundRgb = parseHexColor(backgroundColor)
    const previousPrimaryRgb = parseHexColor(previousFrameRef.current.foregroundColor)
    const previousSecondaryRgb = parseHexColor(previousFrameRef.current.secondaryColor)
    const previousBackgroundRgb = parseHexColor(previousFrameRef.current.backgroundColor)
    const radians = (rotation * Math.PI) / 180
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (time: number) => {
      const t = (time / 1000) * speed
      const transitionStart = transitionStartRef.current
      const transitionProgress =
        transitionStart === null ? 1 : clamp01((time - transitionStart) / 900)
      const easedTransition = smoothstep(transitionProgress)

      if (transitionStart !== null && transitionProgress >= 1) {
        previousFrameRef.current = currentFrame
        transitionStartRef.current = null
      }

      context.clearRect(0, 0, width, height)

      if (backgroundColor !== "transparent") {
        context.globalAlpha = 1
        context.fillStyle = mixColor(
          previousBackgroundRgb,
          currentBackgroundRgb,
          easedTransition,
        )
        context.fillRect(0, 0, width, height)
      }

      const cell = Math.max(2, safePixelSize)
      const aspect = width / Math.max(1, height)

      for (let y = 0, row = 0; y < height + cell; y += cell, row += 1) {
        for (let x = 0, column = 0; x < width + cell; x += cell, column += 1) {
          const centeredX = (x / width - 0.5) * 2 * aspect
          const centeredY = (y / height - 0.5) * 2
          const rx = (centeredX * cos - centeredY * sin) * safeScale
          const ry = (centeredX * sin + centeredY * cos) * safeScale
          const previousSignal = samplePattern(
            previousFrameRef.current.pattern,
            rx,
            ry,
            t,
          )
          const nextSignal = samplePattern(pattern, rx, ry, t)
          const signal =
            previousSignal + (nextSignal - previousSignal) * easedTransition
          const threshold = (BAYER_4[row % 4][column % 4] + 0.5) / 16
          const strength = signal > threshold ? clamp01(signal + 0.18) : 0

          if (strength <= 0) continue

          const inner = Math.max(1, cell - 1)
          const primaryRgb = mixRgb(
            previousPrimaryRgb,
            currentPrimaryRgb,
            easedTransition,
          )
          const secondaryRgb = mixRgb(
            previousSecondaryRgb,
            currentSecondaryRgb,
            easedTransition,
          )
          context.fillStyle = mixColor(primaryRgb, secondaryRgb, signal)
          context.globalAlpha =
            mixNumber(previousFrameRef.current.opacity, opacity, easedTransition) *
            strength
          context.fillRect(x, y, inner, inner)
        }
      }

      context.globalAlpha = 1
      animationId = requestAnimationFrame(draw)
    }

    const observer = new ResizeObserver(() => resize())
    observer.observe(parent)
    resize()
    animationId = requestAnimationFrame(draw)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(animationId)
    }
  }, [
    backgroundColor,
    opacity,
    pattern,
    pixelSize,
    resolvedForegroundColor,
    rotation,
    scale,
    secondaryColor,
    speed,
  ])

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
      aria-hidden="true"
      style={style}
    >
      <canvas ref={canvasRef} style={{ display: "block", height: "100%", width: "100%" }} />
    </div>
  )
}

addPropertyControls(AnimatedDitherBackground, {
  pattern: {
    type: ControlType.Enum,
    title: "Pattern",
    options: ["dots", "ripple", "simplex", "sphere", "swirl", "warp", "wave"],
    optionTitles: ["Dots", "Ripple", "Simplex", "Sphere", "Swirl", "Warp", "Wave"],
  },
  foregroundColor: {
    type: ControlType.Color,
    title: "Foreground",
  },
  secondaryColor: {
    type: ControlType.Color,
    title: "Secondary",
  },
  backgroundColor: {
    type: ControlType.Color,
    title: "Background",
  },
  speed: {
    type: ControlType.Number,
    title: "Speed",
    min: 0,
    max: 3,
    step: 0.05,
  },
  pixelSize: {
    type: ControlType.Number,
    title: "Pixel",
    min: 2,
    max: 28,
    step: 1,
    displayStepper: true,
  },
  scale: {
    type: ControlType.Number,
    title: "Scale",
    min: 0.2,
    max: 4,
    step: 0.05,
  },
  rotation: {
    type: ControlType.Number,
    title: "Rotation",
    min: -180,
    max: 180,
    step: 1,
  },
  opacity: {
    type: ControlType.Number,
    title: "Opacity",
    min: 0,
    max: 1,
    step: 0.01,
  },
})

export default AnimatedDitherBackground
