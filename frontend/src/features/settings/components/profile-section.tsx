import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Upload } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getInitials } from "@/lib/utils"
import type { User } from "@/types"
import {
  SaveBar,
  SectionGroup,
  SettingRow,
  settingsInputClass,
} from "./settings-primitives"

type ProfileForm = {
  name: string
  callName: string
  work: string
  instructions: string
  school: string
  bio: string
}

export function ProfileSection({
  user,
  onSave,
}: {
  user: User
  onSave: (updates: Partial<User>) => void
}) {
  const initialForm = useMemo<ProfileForm>(
    () => ({
      name: user.name,
      callName: user.name.split(" ")[0] ?? user.name,
      work: "High school drama teacher",
      instructions:
        "Keep recommendations practical for public school theatre budgets. Prioritize reusable props, adaptable lesson plans, and clear borrowing timelines.",
      school: user.school ?? "",
      bio: user.bio ?? "",
    }),
    [user.bio, user.name, user.school],
  )
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm)

  function save() {
    setSaving(true)
    window.setTimeout(() => {
      onSave({
        name: form.name,
        school: form.school,
        bio: form.bio,
      })
      setSaving(false)
      toast.success("Profile updated")
    }, 280)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="space-y-2"
    >
      <h2 className="mb-8 text-lg font-semibold text-[#f4f1ea]">Profile</h2>

      <SectionGroup title="Avatar">
        <div className="flex items-center justify-between gap-5">
          <div>
            <p className="text-sm leading-6 text-[#a8a29a]">
              Shown on borrow requests, teacher messages, and shared resources.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 cursor-pointer border-white/10 bg-transparent"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Change avatar
            </Button>
          </div>
          <Avatar className="h-16 w-16 border border-white/10 shadow-lg">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-lg">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </div>
      </SectionGroup>

      <SectionGroup title="Identity">
        <SettingRow label="Full name">
          <Input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            className={settingsInputClass}
          />
        </SettingRow>
        <SettingRow label="What should Skēnē call you?">
          <Input
            value={form.callName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                callName: event.target.value,
              }))
            }
            className={settingsInputClass}
          />
        </SettingRow>
        <SettingRow label="What best describes your work?">
          <Input
            value={form.work}
            onChange={(event) =>
              setForm((current) => ({ ...current, work: event.target.value }))
            }
            className={settingsInputClass}
          />
        </SettingRow>
        <SettingRow label="School">
          <Input
            value={form.school}
            onChange={(event) =>
              setForm((current) => ({ ...current, school: event.target.value }))
            }
            className={settingsInputClass}
          />
        </SettingRow>
      </SectionGroup>

      <SectionGroup
        title="Instructions for Skēnē"
        description="Skēnē uses this context to keep catalog suggestions and collaboration prompts relevant to your theatre program."
      >
        <Textarea
          value={form.instructions}
          rows={7}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              instructions: event.target.value,
            }))
          }
          className="min-h-44 rounded-xl border-white/[0.08] bg-[#30302e] text-[15px] leading-6 text-[#f4f1ea] placeholder:text-[#8f8a82] focus-visible:ring-2 focus-visible:ring-purple-500/70 focus-visible:ring-offset-0"
        />
      </SectionGroup>

      <SectionGroup title="Public bio">
        <Textarea
          value={form.bio}
          rows={4}
          placeholder="Tell other educators about your theatre program..."
          onChange={(event) =>
            setForm((current) => ({ ...current, bio: event.target.value }))
          }
          className="rounded-xl border-white/[0.08] bg-[#30302e] text-[15px] leading-6 text-[#f4f1ea] placeholder:text-[#8f8a82] focus-visible:ring-2 focus-visible:ring-purple-500/70 focus-visible:ring-offset-0"
        />
        <SaveBar
          dirty={dirty}
          saving={saving}
          onReset={() => setForm(initialForm)}
          onSave={save}
          disabled={!form.name.trim()}
        />
      </SectionGroup>
    </motion.div>
  )
}
