import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { cn } from "@/lib/utils"

export default function AppShell() {
  const { pathname } = useLocation()

  const isMessages = pathname.startsWith("/messages")

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)] md:pl-[3.05rem]">
      <Sidebar />

      <div className="flex h-full min-w-0 flex-col pb-16 md:pb-0">
        {!isMessages && <TopBar />}
        <main
          className={cn(
            "min-h-0 flex-1",
            isMessages ? "relative overflow-hidden" : "overflow-auto",
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
