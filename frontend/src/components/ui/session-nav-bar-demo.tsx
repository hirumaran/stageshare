import { SessionNavBar } from "@/components/ui/session-nav-bar"

export function SidebarDemo() {
  return (
    <div className="flex h-screen w-screen flex-row">
      <SessionNavBar />
      <main className="flex h-screen grow flex-col overflow-auto" />
    </div>
  )
}
