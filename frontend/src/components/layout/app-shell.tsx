import { Outlet, useLocation } from "react-router-dom"
import { useEffect, useMemo, useState, type CSSProperties } from "react"
import AnimatedDitherBackground from "@/components/ui/AnimatedDitherBackground"
import {
  type DitherTheme,
  getDailyDitherPreset,
  getDevelopmentDitherOverride,
  hexToRgba,
} from "@/lib/daily-dither-background"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { cn } from "@/lib/utils"

function getResolvedTheme(): DitherTheme {
  if (typeof document === "undefined") return "dark"

  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export default function AppShell() {
  const { pathname, search } = useLocation()
  const [resolvedTheme, setResolvedTheme] = useState<DitherTheme>(getResolvedTheme)

  const isMessages = pathname.startsWith("/messages")
  const isDashboard = pathname.startsWith("/dashboard")
  const isProfile = pathname.startsWith("/profile")
  const usesDitherBackground =
    isDashboard || pathname.startsWith("/settings") || isProfile

  useEffect(() => {
    const syncTheme = () => setResolvedTheme(getResolvedTheme())
    const observer = new MutationObserver(syncTheme)

    syncTheme()
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const dailyDither = useMemo(
    () => getDailyDitherPreset(resolvedTheme, getDevelopmentDitherOverride(search)),
    [resolvedTheme, search],
  )
  const ditherOverlay = useMemo(
    () => {
      const isDark = resolvedTheme === "dark"
      const baseOverlayOpacity = isDark
        ? dailyDither.overlayOpacity
        : Math.min(0.75, dailyDither.overlayOpacity + 0.12)
      return {
        background: `
          radial-gradient(circle at 30% 20%, rgba(255,255,255,${isDark ? 0.035 : 0.08}), transparent 35%),
          radial-gradient(circle at 70% 80%, rgba(0,0,0,${isDark ? 0.08 : 0.04}), transparent 40%),
          linear-gradient(to bottom, ${hexToRgba(dailyDither.background, baseOverlayOpacity * 0.45)}, ${hexToRgba(dailyDither.darkLayer, Math.min(0.85, baseOverlayOpacity + 0.1))}),
          ${hexToRgba(dailyDither.darkLayer, isDark ? 0.32 : 0.12)}
        `,
      }
    },
    [
      dailyDither.background,
      dailyDither.darkLayer,
      dailyDither.overlayOpacity,
      resolvedTheme,
    ],
  )
  const shellStyle = {
    "--sidebar-width": "3.05rem",
    backgroundColor: usesDitherBackground ? dailyDither.background : undefined,
  } as CSSProperties

  return (
    <div
      className={cn(
        "relative h-screen overflow-hidden text-[var(--text-primary)] md:pl-[3.05rem]",
        !usesDitherBackground && "bg-[var(--bg-base)]",
      )}
      style={shellStyle}
    >
      {usesDitherBackground && (
        <>
          <AnimatedDitherBackground
            className="fixed inset-0 z-0 pointer-events-none"
            pattern={dailyDither.pattern}
            foregroundColor={dailyDither.ditherPrimary}
            secondaryColor={dailyDither.ditherSecondary}
            backgroundColor={dailyDither.background}
            speed={0.14}
            pixelSize={10}
            scale={1.4}
            rotation={-8}
            opacity={dailyDither.ditherOpacity}
          />
          <div
            className="pointer-events-none fixed inset-0 z-[1] transition-opacity duration-700"
            style={ditherOverlay}
            aria-hidden="true"
          />
        </>
      )}

      <div className="relative z-20">
        <Sidebar />
      </div>

      <div className="relative z-10 flex h-full min-w-0 flex-col pb-16 md:pb-0">
        {!isMessages && <TopBar />}
        <main
          className={cn(
            "relative z-10 min-h-0 flex-1",
            !isMessages && "pt-24",
            isMessages ? "relative overflow-hidden" : "overflow-auto",
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
