import { useId, useState, type ReactNode } from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { Check, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export const settingsPanelClass =
  "rounded-2xl border shadow-[var(--settings-panel-shadow)] backdrop-blur-xl"

export const settingsInputClass =
  "h-11 rounded-xl text-[15px] shadow-inner focus-visible:ring-2 focus-visible:ring-[var(--ring)]/70 focus-visible:ring-offset-0"

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
        "border-t py-7 first:border-t-0 first:pt-0",
        danger
          ? "rounded-2xl border-[var(--settings-danger-border)] bg-[var(--settings-danger-bg)] p-5"
          : "border-[var(--settings-divider)]",
      )}
    >
      <div className="mb-5">
        <h2 className="text-[15px] font-semibold text-[var(--settings-text)]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--settings-text-muted)]">
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
        "grid gap-3 border-t py-4 first:border-t-0 md:grid-cols-[minmax(13rem,1fr)_minmax(18rem,19rem)]",
        align === "center" ? "md:items-center" : "md:items-start",
        "border-[var(--settings-divider)]",
      )}
    >
      <div>
        <Label className="text-[15px] font-medium text-[var(--settings-text)]">
          {label}
        </Label>
        {description && (
          <p className="mt-1 text-sm leading-6 text-[var(--settings-text-muted)]">
            {description}
          </p>
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
    <SwitchPrimitives.Root
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-[var(--primary)] data-[state=unchecked]:bg-[var(--input)]",
      )}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full shadow-md ring-0 transition-transform duration-200",
          "bg-[var(--bg-base)]",
          "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitives.Root>
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
    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[var(--settings-accent-border)] bg-[var(--settings-accent-bg)] p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--primary)]">Unsaved changes</p>
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
    </div>
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
      <Label htmlFor={id} className="text-sm text-[var(--settings-text-secondary)]">
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
          className={cn(
            settingsInputClass,
            "border-[var(--settings-input-border)] bg-[var(--settings-input-bg)] text-[var(--settings-input-text)] placeholder:text-[var(--settings-input-placeholder)] pr-11",
          )}
        />
        <button
          type="button"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-[var(--settings-text-muted)] transition-colors hover:bg-black/[0.06] hover:text-[var(--settings-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
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
        : "bg-[var(--primary)]"

  return (
    <div className="mt-3 space-y-2" aria-live="polite">
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full bg-[var(--settings-divider)]",
              index < score && activeColor,
            )}
          />
        ))}
      </div>
      <p className="text-xs text-[var(--settings-text-muted)]">
        Strength: {labels[score]}
      </p>
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
    <div className="rounded-2xl border border-[var(--settings-danger-border)] bg-[var(--settings-danger-bg)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-medium text-[var(--settings-text)]">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--settings-text-muted)]">
            {description}
          </p>
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
        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--settings-danger-border)] bg-[var(--settings-card-bg)] p-3">
          <p className="text-sm text-[var(--settings-text-secondary)]">
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
        </div>
      )}
    </div>
  )
}

export function SelectedMark() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--primary)] text-white">
      <Check className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
  )
}
