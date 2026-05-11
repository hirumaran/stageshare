import type { DitherPattern } from "@/components/ui/AnimatedDitherBackground"

export type DitherTheme = "dark" | "light"

export type DitherPaletteName =
  | "Indigo Backstage"
  | "Amber Spotlight"
  | "Olive Velvet"
  | "Wine Curtain"
  | "Dusty Plum"
  | "Aged Brass"
  | "Blue Shadow"

export type DitherPalette = {
  name: DitherPaletteName
  background: string
  darkLayer: string
  ditherPrimary: string
  ditherSecondary: string
  ditherOpacity: number
  overlayOpacity: number
}

export type DailyDitherPreset = DitherPalette & {
  pattern: DitherPattern
  dayIndex: number
  theme: DitherTheme
}

export type DailyDitherOverride = {
  pattern?: DitherPattern
  palette?: DitherPaletteName
  date?: Date
}

type PairedDitherPreset = {
  name: DitherPaletteName
  dark: DitherPalette
  light: DitherPalette
}

const makePalette = (
  name: DitherPaletteName,
  values: Omit<DitherPalette, "name" | "overlayOpacity">,
  overlayOpacity: number,
): DitherPalette => ({
  name,
  ...values,
  overlayOpacity,
})

export const DAILY_DITHER_PRESETS: PairedDitherPreset[] = [
  {
    name: "Indigo Backstage",
    dark: makePalette(
      "Indigo Backstage",
      {
        background: "#151311",
        darkLayer: "#211D1A",
        ditherPrimary: "#25294A",
        ditherSecondary: "#5E6CFF",
        ditherOpacity: 0.28,
      },
      0.65,
    ),
    light: makePalette(
      "Indigo Backstage",
      {
        background: "#F3EFE8",
        darkLayer: "#E4DDD2",
        ditherPrimary: "#C8C1B8",
        ditherSecondary: "#8A91C8",
        ditherOpacity: 0.16,
      },
      0.25,
    ),
  },
  {
    name: "Amber Spotlight",
    dark: makePalette(
      "Amber Spotlight",
      {
        background: "#1A1510",
        darkLayer: "#2A2117",
        ditherPrimary: "#6E4B22",
        ditherSecondary: "#C58A3A",
        ditherOpacity: 0.24,
      },
      0.65,
    ),
    light: makePalette(
      "Amber Spotlight",
      {
        background: "#F6EEDC",
        darkLayer: "#E9D8B8",
        ditherPrimary: "#D1B77E",
        ditherSecondary: "#A8732E",
        ditherOpacity: 0.15,
      },
      0.25,
    ),
  },
  {
    name: "Olive Velvet",
    dark: makePalette(
      "Olive Velvet",
      {
        background: "#141811",
        darkLayer: "#1E2B1B",
        ditherPrimary: "#4A5A2A",
        ditherSecondary: "#A99D54",
        ditherOpacity: 0.22,
      },
      0.65,
    ),
    light: makePalette(
      "Olive Velvet",
      {
        background: "#EFF3E8",
        darkLayer: "#DDE7D1",
        ditherPrimary: "#B8C4A2",
        ditherSecondary: "#71804A",
        ditherOpacity: 0.15,
      },
      0.25,
    ),
  },
  {
    name: "Wine Curtain",
    dark: makePalette(
      "Wine Curtain",
      {
        background: "#181111",
        darkLayer: "#281515",
        ditherPrimary: "#5A2428",
        ditherSecondary: "#9E3D35",
        ditherOpacity: 0.2,
      },
      0.65,
    ),
    light: makePalette(
      "Wine Curtain",
      {
        background: "#F4EAEA",
        darkLayer: "#E8D5D3",
        ditherPrimary: "#C9A4A0",
        ditherSecondary: "#9B5552",
        ditherOpacity: 0.13,
      },
      0.25,
    ),
  },
  {
    name: "Dusty Plum",
    dark: makePalette(
      "Dusty Plum",
      {
        background: "#16131A",
        darkLayer: "#211B28",
        ditherPrimary: "#3F315A",
        ditherSecondary: "#7D6BA8",
        ditherOpacity: 0.24,
      },
      0.65,
    ),
    light: makePalette(
      "Dusty Plum",
      {
        background: "#F0ECF3",
        darkLayer: "#DED6E7",
        ditherPrimary: "#BDB0CA",
        ditherSecondary: "#7F6A9F",
        ditherOpacity: 0.15,
      },
      0.25,
    ),
  },
  {
    name: "Aged Brass",
    dark: makePalette(
      "Aged Brass",
      {
        background: "#17140F",
        darkLayer: "#252015",
        ditherPrimary: "#6E5526",
        ditherSecondary: "#B4934B",
        ditherOpacity: 0.22,
      },
      0.65,
    ),
    light: makePalette(
      "Aged Brass",
      {
        background: "#F5EEDC",
        darkLayer: "#E5D6B6",
        ditherPrimary: "#C7AF73",
        ditherSecondary: "#8D6E32",
        ditherOpacity: 0.14,
      },
      0.25,
    ),
  },
  {
    name: "Blue Shadow",
    dark: makePalette(
      "Blue Shadow",
      {
        background: "#111418",
        darkLayer: "#191D24",
        ditherPrimary: "#25334F",
        ditherSecondary: "#6277B8",
        ditherOpacity: 0.26,
      },
      0.65,
    ),
    light: makePalette(
      "Blue Shadow",
      {
        background: "#EEF1F4",
        darkLayer: "#D9DEE7",
        ditherPrimary: "#B4BDCC",
        ditherSecondary: "#65769E",
        ditherOpacity: 0.16,
      },
      0.25,
    ),
  },
]

const PATTERNS_BY_DAY: DitherPattern[] = [
  "dots", // Sunday
  "swirl", // Monday
  "ripple", // Tuesday
  "wave", // Wednesday
  "warp", // Thursday
  "sphere", // Friday
  "simplex", // Saturday
]

const PRESET_INDEX_BY_DAY = [
  6, // Sunday: Blue Shadow
  0, // Monday: Indigo Backstage
  1, // Tuesday: Amber Spotlight
  2, // Wednesday: Olive Velvet
  3, // Thursday: Wine Curtain
  4, // Friday: Dusty Plum
  5, // Saturday: Aged Brass
]

export const DITHER_PATTERNS: DitherPattern[] = [
  "dots",
  "ripple",
  "simplex",
  "sphere",
  "swirl",
  "warp",
  "wave",
]

export function getDailyPattern(date = new Date()) {
  return PATTERNS_BY_DAY[date.getDay()]
}

export function getDailyDitherPreset(
  theme: DitherTheme,
  {
    pattern,
    palette,
    date = new Date(),
  }: DailyDitherOverride = {},
): DailyDitherPreset {
  const dayIndex = date.getDay()
  const mode = theme === "dark" ? "dark" : "light"
  const resolvedPreset =
    DAILY_DITHER_PRESETS.find((item) => item.name === palette) ??
    DAILY_DITHER_PRESETS[PRESET_INDEX_BY_DAY[dayIndex]]
  const resolvedPattern = pattern ?? getDailyPattern(date)

  return {
    ...resolvedPreset[mode],
    pattern: resolvedPattern,
    dayIndex,
    theme: mode,
  }
}

export function getDevelopmentDitherOverride(
  search = typeof window === "undefined" ? "" : window.location.search,
): DailyDitherOverride {
  const isDevelopment =
    (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV ?? false

  if (!isDevelopment || !search) return {}

  const params = new URLSearchParams(search)
  const pattern = params.get("ditherPattern")
  const palette = params.get("ditherPalette")
  const date = params.get("ditherDate")
  const parsedDate = date ? new Date(`${date}T12:00:00`) : undefined

  return {
    pattern: DITHER_PATTERNS.includes(pattern as DitherPattern)
      ? (pattern as DitherPattern)
      : undefined,
    palette: DAILY_DITHER_PRESETS.some((item) => item.name === palette)
      ? (palette as DitherPaletteName)
      : undefined,
    date: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : undefined,
  }
}

export function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "")
  const value = Number.parseInt(normalized, 16)

  if (Number.isNaN(value)) {
    return `rgba(23, 21, 19, ${alpha})`
  }

  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
