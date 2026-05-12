import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { SectionGroup, SettingRow, ToggleSwitch } from "./settings-primitives"

const notificationRows = [
  {
    id: "borrow",
    label: "Borrow requests",
    description: "When another teacher requests one of your shared resources.",
  },
  {
    id: "messages",
    label: "Messages",
    description: "When a partner educator sends a direct message.",
  },
  {
    id: "reviews",
    label: "Reviews",
    description: "When someone leaves feedback after borrowing an item.",
  },
  {
    id: "digest",
    label: "Weekly digest",
    description: "A short summary of new resources and nearby activity.",
  },
]

export function NotificationsSection() {
  const [email, setEmail] = useState<Record<string, boolean>>({
    borrow: true,
    messages: true,
    reviews: true,
    digest: true,
  })
  const [inApp, setInApp] = useState<Record<string, boolean>>({
    borrow: true,
    messages: true,
    reviews: false,
    digest: false,
  })
  const [quietHours, setQuietHours] = useState(true)

  function update(
    channel: "email" | "inApp",
    id: string,
    checked: boolean,
  ) {
    if (channel === "email") {
      setEmail((current) => ({ ...current, [id]: checked }))
    } else {
      setInApp((current) => ({ ...current, [id]: checked }))
    }
    toast.success("Notification preference saved")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <h2 className="mb-8 text-lg font-semibold text-[#f4f1ea]">
        Notifications
      </h2>

      <SectionGroup
        title="Delivery"
        description="Toggles auto-save so notification changes take effect immediately."
      >
        <div className="mb-2 hidden grid-cols-[1fr_4rem_4rem] gap-4 px-1 text-right text-xs font-medium uppercase tracking-[0.14em] text-[#8f8a82] md:grid">
          <span />
          <span>Email</span>
          <span>In-app</span>
        </div>
        {notificationRows.map((row) => (
          <SettingRow
            key={row.id}
            label={row.label}
            description={row.description}
          >
            <div className="flex items-center justify-end gap-6">
              <div className="flex items-center gap-2 md:block">
                <span className="text-xs text-[#8f8a82] md:hidden">Email</span>
                <ToggleSwitch
                  checked={email[row.id]}
                  label={`${row.label} email notifications`}
                  onChange={(checked) => update("email", row.id, checked)}
                />
              </div>
              <div className="flex items-center gap-2 md:block">
                <span className="text-xs text-[#8f8a82] md:hidden">In-app</span>
                <ToggleSwitch
                  checked={inApp[row.id]}
                  label={`${row.label} in-app notifications`}
                  onChange={(checked) => update("inApp", row.id, checked)}
                />
              </div>
            </div>
          </SettingRow>
        ))}
      </SectionGroup>

      <SectionGroup
        title="Quiet hours"
        description="Pause non-urgent notifications while school is out."
      >
        <SettingRow label="Weeknight quiet hours" description="6:00 PM to 7:00 AM">
          <div className="flex justify-end">
            <ToggleSwitch
              checked={quietHours}
              label="Weeknight quiet hours"
              onChange={(checked) => {
                setQuietHours(checked)
                toast.success("Quiet hours saved")
              }}
            />
          </div>
        </SettingRow>
      </SectionGroup>
    </motion.div>
  )
}
