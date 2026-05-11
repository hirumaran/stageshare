"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { flushSync } from "react-dom"
import { Moon, Sun } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

type AnimatedThemeTogglerProps = {
  className?: string
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> }
}

export const AnimatedThemeToggler = ({ className }: AnimatedThemeTogglerProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false,
  )

  useEffect(() => {
    const syncTheme = () =>
      setDarkMode(document.documentElement.classList.contains("dark"))

    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  const applyTheme = useCallback((toggled: boolean) => {
    setDarkMode(toggled)
    document.documentElement.classList.toggle("dark", toggled)
    document.documentElement.classList.toggle("light", !toggled)
    localStorage.setItem("theme", toggled ? "dark" : "light")
    localStorage.setItem("ui-theme", toggled ? "dark" : "light")
  }, [])

  const onToggle = useCallback(async () => {
    if (!buttonRef.current) return

    const toggled = !darkMode
    const viewTransitionDocument = document as ViewTransitionDocument

    if (!viewTransitionDocument.startViewTransition) {
      applyTheme(toggled)
      return
    }

    await viewTransitionDocument.startViewTransition(() => {
      flushSync(() => {
        applyTheme(toggled)
      })
    }).ready

    const { left, top, width, height } = buttonRef.current.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2
    const maxDistance = Math.hypot(
      Math.max(centerX, window.innerWidth - centerX),
      Math.max(centerY, window.innerHeight - centerY),
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${centerX}px ${centerY}px)`,
          `circle(${maxDistance}px at ${centerX}px ${centerY}px)`,
        ],
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    )
  }, [applyTheme, darkMode])

  return (
    <button
      ref={buttonRef}
      onClick={onToggle}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex cursor-pointer items-center justify-center rounded-full p-2 outline-none transition-colors duration-200 focus:outline-none focus:ring-0 active:outline-none hover:bg-black/5 dark:hover:bg-white/10",
        className,
      )}
      type="button"
    >
      <AnimatePresence mode="wait" initial={false}>
        {darkMode ? (
          <motion.span
            key="sun-icon"
            initial={{ opacity: 0, scale: 0.55, rotate: 25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.33 }}
            className="text-white/90"
          >
            <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </motion.span>
        ) : (
          <motion.span
            key="moon-icon"
            initial={{ opacity: 0, scale: 0.55, rotate: -25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.33 }}
            className="text-black/90 dark:text-white/90"
          >
            <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
