import type { CSSProperties } from "react"
import { useReducedMotion } from "framer-motion"

type EntranceAnimation = "fadeSlideUp" | "scaleXIn"

export function useStaggeredEntrance(baseDelay = 0, stepDelay = 0) {
  const shouldReduceMotion = useReducedMotion()

  return (
    index = 0,
    duration = 400,
    animationName: EntranceAnimation = "fadeSlideUp",
  ): CSSProperties => {
    if (shouldReduceMotion) return {}

    return {
      animation: `${animationName} ${duration}ms ease both`,
      animationDelay: `${baseDelay + index * stepDelay}ms`,
    }
  }
}
