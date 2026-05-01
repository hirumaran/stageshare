import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

export default function AppShell() {
  const { sidebarCollapsed } = useUIStore()
  const { pathname } = useLocation()

  const isMessages = pathname.startsWith("/messages")
  const isDashboard = pathname.startsWith("/dashboard")

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div
        className={cn(
          "flex flex-1 flex-col transition-[margin] duration-300 ease-in-out",
          !sidebarCollapsed ? "lg:ml-72" : "lg:ml-20",
        )}
      >
        {!isMessages && !isDashboard && <Header />}
        <main
          className={cn(
            "flex-1",
            isMessages
              ? "relative overflow-hidden"
              : isDashboard
                ? "overflow-auto"
              : "overflow-auto p-4 lg:p-6",
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
