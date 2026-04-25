/**
 * Deterministic avatar palette and initials for participants.
 * Uses a wide palette of dark-mode-friendly muted colours so each contact
 * is visually distinct without clashing with the app theme.
 */

export interface AvatarPalette {
  bg: string
  text: string
  ring: string
}

const palettes: AvatarPalette[] = [
  { bg: "bg-amber-900/40", text: "text-amber-200", ring: "ring-amber-800" },
  { bg: "bg-emerald-900/40", text: "text-emerald-200", ring: "ring-emerald-800" },
  { bg: "bg-sky-900/40", text: "text-sky-200", ring: "ring-sky-800" },
  { bg: "bg-rose-900/40", text: "text-rose-200", ring: "ring-rose-800" },
  { bg: "bg-violet-900/40", text: "text-violet-200", ring: "ring-violet-800" },
  { bg: "bg-orange-900/40", text: "text-orange-200", ring: "ring-orange-800" },
  { bg: "bg-teal-900/40", text: "text-teal-200", ring: "ring-teal-800" },
  { bg: "bg-cyan-900/40", text: "text-cyan-200", ring: "ring-cyan-800" },
  { bg: "bg-fuchsia-900/40", text: "text-fuchsia-200", ring: "ring-fuchsia-800" },
  { bg: "bg-lime-900/40", text: "text-lime-200", ring: "ring-lime-800" },
]

export function getAvatarPalette(seed: string): AvatarPalette {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return palettes[hash % palettes.length]
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
