import { lazy, Suspense } from "react"

const MessagesPage = lazy(() => import("@/features/messages/messages-page"))

export default function MessagesRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-12 w-48 animate-pulse rounded-md bg-muted" />
        </div>
      }
    >
      <MessagesPage />
    </Suspense>
  )
}
