import { motion } from "framer-motion"
import { toast } from "sonner"
import { DangerAction, SectionGroup } from "./settings-primitives"

export function DangerZoneSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <h2 className="mb-8 text-lg font-semibold text-[var(--settings-heading)]">
        Danger Zone
      </h2>

      <SectionGroup
        title="Account data"
        description="Export or disable your Skēnē account. These actions require confirmation."
        danger
      >
        <div className="space-y-3">
          <DangerAction
            title="Export data"
            description="Download profile, borrowing history, saved resources, and message metadata."
            actionLabel="Export"
            onConfirm={() => toast.success("Data export requested")}
          />
          <DangerAction
            title="Deactivate account"
            description="Temporarily hide your shared resources and pause incoming borrow requests."
            actionLabel="Deactivate"
            onConfirm={() => toast.success("Account deactivation queued")}
          />
          <DangerAction
            title="Delete account"
            description="Permanently remove this account after existing borrow requests are resolved."
            actionLabel="Delete"
            destructive
            onConfirm={() => toast.success("Delete request confirmed")}
          />
        </div>
      </SectionGroup>
    </motion.div>
  )
}
