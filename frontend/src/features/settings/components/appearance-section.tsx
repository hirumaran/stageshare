import { useState } from "react"
import { motion } from "framer-motion"
import { Monitor, Moon, Palette, Sun } from "lucide-react"
import { toast } from "sonner"
import type { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import {
  SectionGroup,
  SelectedMark,
  SettingRow,
  ToggleSwitch,
} from "./settings-primitives"

type ThemeValue = "light" | "dark" | "system"

const themeOptions: Array<{
  value: ThemeValue
  label: string
  description: string
  icon: typeof Sun
}> = [
  {
    value: "light",
    label: "Light",
    description: "Parchment surfaces for daytime planning.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Backstage low-light mode.",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Follow this device.",
    icon: Monitor,
  },
]

const accentOptions = [
  { label: "Indigo", value: "#5E6CFF" },
  { label: "Amber", value: "#C58A3A" },
  { label: "Olive", value: "#A99D54" },
  { label: "Plum", value: "#7D6BA8" },
]

export function AppearanceSection({
  theme,
  setTheme,
}: ReturnType<typeof useTheme>) {
  const [accent, setAccent] = useState(accentOptions[0].value)
  const [compact, setCompact] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <h2 className="mb-8 text-lg font-semibold text-[#f4f1ea]">Appearance</h2>

      <SectionGroup
        title="Theme"
        description="Choose how Skēnē renders the settings interface and dashboard surfaces."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {themeOptions.map((option) => {
            const Icon = option.icon
            const selected = theme === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={cn(
                  "group relative cursor-pointer rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                  selected
                    ? "border-purple-400/50 bg-purple-500/15 shadow-[0_10px_40px_rgba(94,108,255,0.14)]"
                    : "border-white/[0.08] bg-[#242422]/70 hover:border-white/15 hover:bg-[#2b2b29]",
                )}
              >
                <div className="mb-5 flex items-center justify-between">
                  <Icon className="h-4 w-4 text-[#d8d2c8]" aria-hidden="true" />
                  {selected && <SelectedMark />}
                </div>
                <p className="text-sm font-medium text-[#f4f1ea]">
                  {option.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#8f8a82]">
                  {option.description}
                </p>
              </button>
            )
          })}
        </div>
      </SectionGroup>

      <SectionGroup title="Personalization">
        <SettingRow
          label="Accent color"
          description="Used for active controls, badges, and focus states."
        >
          <div className="flex justify-end gap-2">
            {accentOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-label={`${option.label} accent`}
                onClick={() => {
                  setAccent(option.value)
                  toast.success(`${option.label} accent selected`)
                }}
                className={cn(
                  "grid h-9 w-9 cursor-pointer place-items-center rounded-full border transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                  accent === option.value
                    ? "border-white/70"
                    : "border-white/10",
                )}
              >
                <span
                  className="h-6 w-6 rounded-full"
                  style={{ backgroundColor: option.value }}
                />
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow
          label="Compact mode"
          description="Tighten vertical density for repeat administrative work."
        >
          <div className="flex justify-end">
            <ToggleSwitch
              checked={compact}
              label="Compact mode"
              onChange={(checked) => {
                setCompact(checked)
                toast.success(checked ? "Compact mode on" : "Compact mode off")
              }}
            />
          </div>
        </SettingRow>
        <SettingRow
          label="Reduce motion"
          description="Minimize transitions while preserving essential feedback."
        >
          <div className="flex justify-end">
            <ToggleSwitch
              checked={reduceMotion}
              label="Reduce motion"
              onChange={(checked) => {
                setReduceMotion(checked)
                toast.success(checked ? "Motion reduced" : "Motion restored")
              }}
            />
          </div>
        </SettingRow>
      </SectionGroup>

      <SectionGroup title="Preview">
        <div className="rounded-2xl border border-white/[0.08] bg-[#242422]/70 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Palette className="h-4 w-4 text-purple-300" aria-hidden="true" />
            <p className="text-sm font-medium text-[#f4f1ea]">
              Theatre workspace
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {["Resource", "Request", "Message"].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/[0.08] bg-[#30302e] p-3"
              >
                <div
                  className="mb-3 h-1.5 w-10 rounded-full"
                  style={{ backgroundColor: accent }}
                />
                <p className="text-sm text-[#f4f1ea]">{item}</p>
                <p className="mt-1 text-xs text-[#8f8a82]">
                  Preview surface
                </p>
              </div>
            ))}
          </div>
        </div>
      </SectionGroup>
    </motion.div>
  )
}
