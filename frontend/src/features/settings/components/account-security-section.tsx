import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import type { User } from "@/types"
import {
  PasswordInput,
  SaveBar,
  SectionGroup,
  SettingRow,
  StrengthMeter,
  ToggleSwitch,
  passwordStrength,
  settingsInputClass,
} from "./settings-primitives"

export function AccountSecuritySection({ user }: { user: User }) {
  const initialEmail = useMemo(() => user.email, [user.email])
  const [email, setEmail] = useState(initialEmail)
  const [savingEmail, setSavingEmail] = useState(false)
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  })
  const [savingPassword, setSavingPassword] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)
  const emailDirty = email !== initialEmail
  const passwordDirty = Object.values(passwords).some(Boolean)
  const mismatch = passwords.confirm.length > 0 && passwords.confirm !== passwords.next
  const weak = passwords.next.length > 0 && passwordStrength(passwords.next) < 3
  const canSavePassword =
    passwords.current.length > 0 &&
    passwords.next.length > 0 &&
    passwords.confirm.length > 0 &&
    !mismatch &&
    !weak

  function saveEmail() {
    setSavingEmail(true)
    window.setTimeout(() => {
      setSavingEmail(false)
      toast.success("Email settings saved")
    }, 250)
  }

  function savePassword() {
    setSavingPassword(true)
    window.setTimeout(() => {
      setPasswords({ current: "", next: "", confirm: "" })
      setSavingPassword(false)
      toast.success("Password updated")
    }, 300)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <h2 className="mb-8 text-lg font-semibold text-[#f4f1ea]">
        Account & Security
      </h2>

      <SectionGroup
        title="Email"
        description="Use the school email other educators can recognize when they receive a request."
      >
        <SettingRow label="Email address">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={settingsInputClass}
          />
        </SettingRow>
        <SaveBar
          dirty={emailDirty}
          saving={savingEmail}
          onReset={() => setEmail(initialEmail)}
          onSave={saveEmail}
          disabled={!email.includes("@")}
        />
      </SectionGroup>

      <SectionGroup
        title="Password"
        description="Change the password used to access this Skēnē account."
      >
        <div className="space-y-5">
          <PasswordInput
            label="Current password"
            value={passwords.current}
            placeholder="Enter current password"
            autoComplete="current-password"
            onChange={(value) =>
              setPasswords((current) => ({ ...current, current: value }))
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <PasswordInput
                label="New password"
                value={passwords.next}
                placeholder="Create new password"
                autoComplete="new-password"
                onChange={(value) =>
                  setPasswords((current) => ({ ...current, next: value }))
                }
              />
              <StrengthMeter password={passwords.next} />
            </div>
            <div>
              <PasswordInput
                label="Confirm password"
                value={passwords.confirm}
                placeholder="Repeat new password"
                autoComplete="new-password"
                onChange={(value) =>
                  setPasswords((current) => ({ ...current, confirm: value }))
                }
              />
              {mismatch && (
                <p className="mt-2 text-xs text-red-300">
                  Passwords do not match.
                </p>
              )}
              {weak && !mismatch && (
                <p className="mt-2 text-xs text-amber-300">
                  Use a stronger password before saving.
                </p>
              )}
            </div>
          </div>
        </div>
        <SaveBar
          dirty={passwordDirty}
          saving={savingPassword}
          onReset={() =>
            setPasswords({ current: "", next: "", confirm: "" })
          }
          onSave={savePassword}
          disabled={!canSavePassword}
        />
      </SectionGroup>

      <SectionGroup
        title="Two-factor authentication"
        description="Toggles auto-save. Turn this on for extra protection before sharing resources with partner schools."
      >
        <SettingRow label="Require verification code">
          <div className="flex justify-end">
            <ToggleSwitch
              checked={twoFactor}
              label="Require verification code"
              onChange={(checked) => {
                setTwoFactor(checked)
                toast.success(checked ? "2FA enabled" : "2FA disabled")
              }}
            />
          </div>
        </SettingRow>
      </SectionGroup>
    </motion.div>
  )
}
