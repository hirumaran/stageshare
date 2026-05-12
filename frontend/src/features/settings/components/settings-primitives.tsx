import { useId, useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import { Check, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export const settingsPanelClass =
  "rounded-2xl border border-white/[0.08] bg-[#1f1f1d]/76 text-[#f4f1ea] shadow-[0_18px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl"

export const settingsInputClass =
  "h-11 rounded-xl border-white/[0.08] bg-[#30302e] text-[15px] text-[#f4f1ea] placeholder:text-[#8f8a82] shadow-inner shadow-black/10 focus-visible:ring-2 focus-visible:ring-purple-500/70 focus-visible:ring-offset-0"

export function SectionGroup({
  title,
  description,
  children,
  danger,
}: {
  title: string
  description?: string
  children: ReactNode
  danger?: boolean
}) {
  return (
    <section
      className={cn(
        "border-t border-white/[0.08] py-7 first:border-t-0 first:pt-0",
        danger && "rounded-2xl border border-red-400/20 bg-red-950/10 p-5",
      )}
    >
      <div className="mb-5">
        <h2 className="text-[15px] font-semibold text-[#f4f1ea]">{title}</h2>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#a8a29a]">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

export function SettingRow({
  label,
  description,
  children,
  align = "center",
}: {
  label: string
  description?: string
  children: ReactNode
  align?: "center" | "start"
}) {
  return (
    <div
      className={cn(
        "grid gap-3 border-t border-white/[0.08] py-4 first:border-t-0 md:grid-cols-[minmax(13rem,1fr)_minmax(18rem,19rem)]",
        align === "center" ? "md:items-center" : "md:items-start",
      )}
    >
      <div>
        <Label className="text-[15px] font-medium text-[#f4f1ea]">
          {label}
        </Label>
        {description && (
          <p className="mt-1 text-sm leading-6 text-[#8f8a82]">{description}</p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 cursor-pointer rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/80 disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "border-purple-500/40 bg-purple-500"
          : "border-white/10 bg-[#30302e]",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 520, damping: 34 }}
        className={cn(
          "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[#f4f1ea] shadow-sm",
          checked ? "left-[1.55rem]" : "left-1",
        )}
      />
    </button>
  )
}

export function SaveBar({
  dirty,
  saving,
  onSave,
  onReset,
  disabled,
}: {
  dirty: boolean
  saving?: boolean
  onSave: () => void
  onReset: () => void
  disabled?: boolean
}) {
  if (!dirty) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="mt-5 flex flex-col gap-3 rounded-2xl border border-purple-400/20 bg-purple-500/10 p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-purple-100">Unsaved changes</p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="cursor-pointer"
          disabled={saving}
          onClick={onReset}
        >
          Reset
        </Button>
        <Button
          type="button"
          size="sm"
          className="cursor-pointer"
          disabled={saving || disabled}
          onClick={onSave}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </motion.div>
  )
}

export function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)
  const id = useId()

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm text-[#d8d2c8]">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn(settingsInputClass, "pr-11")}
        />
        <button
          type="button"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-[#a8a29a] transition-colors hover:bg-white/[0.06] hover:text-[#f4f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
}

export function passwordStrength(password: string) {
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return Math.min(score, 5)
}

export function StrengthMeter({ password }: { password: string }) {
  const score = passwordStrength(password)
  const labels = ["Empty", "Weak", "Basic", "Fair", "Strong", "Excellent"]
  const activeColor =
    score <= 1
      ? "bg-red-400"
      : score <= 3
        ? "bg-amber-400"
        : "bg-purple-400"

  return (
    <div className="mt-3 space-y-2" aria-live="polite">
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full bg-white/[0.08]",
              index < score && activeColor,
            )}
          />
        ))}
      </div>
      <p className="text-xs text-[#8f8a82]">Strength: {labels[score]}</p>
    </div>
  )
}

export function DangerAction({
  title,
  description,
  actionLabel,
  onConfirm,
  destructive,
}: {
  title: string
  description: string
  actionLabel: string
  onConfirm: () => void
  destructive?: boolean
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="rounded-2xl border border-red-400/20 bg-red-950/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-medium text-[#f4f1ea]">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#a8a29a]">{description}</p>
        </div>
        <Button
          type="button"
          variant={destructive ? "destructive" : "outline"}
          size="sm"
          className="shrink-0 cursor-pointer"
          onClick={() => setConfirming(true)}
        >
          {actionLabel}
        </Button>
      </div>
      {confirming && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 overflow-hidden rounded-xl border border-red-400/20 bg-black/20 p-3"
        >
          <p className="text-sm text-[#d8d2c8]">
            Confirm this action for Sarah Johnson's Skēnē account.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={destructive ? "destructive" : "default"}
              size="sm"
              className="cursor-pointer"
              onClick={() => {
                onConfirm()
                setConfirming(false)
              }}
            >
              Confirm
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export function SelectedMark() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-full bg-purple-500 text-white">
      <Check className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
  )
}
