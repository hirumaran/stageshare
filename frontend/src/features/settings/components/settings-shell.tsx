import { useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { AlertTriangle, Bell, Palette, Shield, UserCircle } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useAuthStore } from "@/stores/auth-store"
import { cn } from "@/lib/utils"
import { AccountSecuritySection } from "./account-security-section"
import { AppearanceSection } from "./appearance-section"
import { DangerZoneSection } from "./danger-zone-section"
import { NotificationsSection } from "./notifications-section"
import { ProfileSection } from "./profile-section"
import { settingsPanelClass } from "./settings-primitives"

type SettingsSection = "general" | "account" | "appearance" | "notifications" | "danger"

const sections: Array<{
  id: SettingsSection
  label: string
  description: string
  icon: typeof UserCircle
}> = [
  {
    id: "general",
    label: "General",
    description: "Profile and teaching context",
    icon: UserCircle,
  },
  {
    id: "account",
    label: "Account",
    description: "Email, password, and security",
    icon: Shield,
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Theme and display preferences",
    icon: Palette,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Email and in-app alerts",
    icon: Bell,
  },
  {
    id: "danger",
    label: "Danger Zone",
    description: "Export, deactivate, or delete",
    icon: AlertTriangle,
  },
]

export function SettingsShell() {
  const { user, updateProfile } = useAuthStore()
  const themeTools = useTheme()
  const [activeSection, setActiveSection] = useState<SettingsSection>("general")
  const prefersReducedMotion = useReducedMotion()

  if (!user) return null

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: "easeOut" as const }

  return (
    <div className="mx-auto w-full max-w-[1220px] px-6 pb-20 pt-0 md:px-10 lg:pl-4 lg:pr-14">
      <div className="grid gap-8 lg:grid-cols-[13.5rem_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-10 lg:self-start lg:pt-8">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
            className="mb-2"
          >
            <h1 className="font-display text-4xl font-medium tracking-tight text-[var(--settings-heading)] md:text-5xl">
              Settings
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--settings-text-muted)]">
              Manage your Skēnē account, theatre profile, and workspace preferences.
            </p>
          </motion.div>

          <nav aria-label="Settings sections">
            <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
              {sections.map((section) => {
                const selected = section.id === activeSection
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "group relative flex min-w-fit cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] lg:w-full",
                      selected
                        ? "bg-[var(--settings-nav-active-bg)] text-[var(--settings-nav-active-text)] shadow-[var(--settings-accent-glow)]"
                        : "text-[var(--settings-nav-text)] hover:bg-[var(--settings-nav-hover-bg)] hover:text-[var(--settings-text)]",
                    )}
                    aria-current={selected ? "page" : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors lg:hidden",
                        selected ? "text-[var(--primary)]" : "text-[var(--settings-nav-text-muted)]",
                      )}
                      aria-hidden="true"
                    />
                    <span>
                      <span className="block font-medium">{section.label}</span>
                      <span className="mt-0.5 hidden text-xs leading-4 text-[var(--settings-nav-text-muted)] lg:block">
                        {section.description}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </nav>
        </div>

        <div className="min-w-0">
          <div
            className={cn(
              settingsPanelClass,
              "max-w-[720px] border-[var(--settings-panel-border)] bg-[var(--settings-panel-bg)] p-6 md:p-8",
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                transition={transition}
              >
                {activeSection === "general" && (
                  <ProfileSection user={user} onSave={updateProfile} />
                )}
                {activeSection === "account" && (
                  <AccountSecuritySection user={user} />
                )}
                {activeSection === "appearance" && (
                  <AppearanceSection {...themeTools} />
                )}
                {activeSection === "notifications" && <NotificationsSection />}
                {activeSection === "danger" && <DangerZoneSection />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
