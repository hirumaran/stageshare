/**
 * Deterministic avatar palette and initials for participants.
 * Palette stays within a small, restrained set of soft tints so the page
 * remains cohesive while giving each contact a recognizable identity.
 */

export interface AvatarPalette {
  bg: string
  text: string
  ring: string
}

const palettes: AvatarPalette[] = [
  { bg: "bg-amber-100", text: "text-amber-900", ring: "ring-amber-200" },
  { bg: "bg-emerald-100", text: "text-emerald-900", ring: "ring-emerald-200" },
  { bg: "bg-sky-100", text: "text-sky-900", ring: "ring-sky-200" },
  { bg: "bg-rose-100", text: "text-rose-900", ring: "ring-rose-200" },
  { bg: "bg-zinc-200", text: "text-zinc-800", ring: "ring-zinc-300" },
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
