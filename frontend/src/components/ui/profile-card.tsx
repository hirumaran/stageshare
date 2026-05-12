import React from "react"
import { cn } from "@/lib/utils"

export interface ProfileCardProps {
  name?: string
  handle?: string
  timestamp?: string
  imageSrc?: string
  avatarSrc?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

const defaultImage =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"

export const ProfileCard = ({
  name = "John Doe",
  handle = "@johndoe",
  timestamp = "12m ago",
  imageSrc = defaultImage,
  avatarSrc = imageSrc,
  actionLabel = "+ Add member",
  onAction,
  className,
}: ProfileCardProps) => {
  return (
    <>
      <style>
        {`
          .profile-card-hover-scale {
            transition: transform 700ms ease-out;
          }

          .profile-card-hover-scale:hover {
            transform: scale(1.02);
          }

          .profile-card-image-scale {
            transition: transform 700ms ease-out;
          }

          .profile-card-image-container:hover .profile-card-image-scale {
            transform: scale(1.03);
          }

          .profile-card-hover-translate {
            transition: transform 500ms ease-out;
          }

          .profile-card-hover-translate:hover {
            transform: translateX(4px);
          }

          .profile-card-hover-scale-sm {
            transition: transform 500ms ease-out;
          }

          .profile-card-hover-scale-sm:hover {
            transform: scale(1.1);
          }
        `}
      </style>

      <div className={cn("w-full max-w-md", className)}>
        <div className="profile-card-hover-scale overflow-hidden rounded-3xl border border-black/10 bg-white/80 shadow-lg backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#24201d]/[0.82] dark:shadow-2xl dark:shadow-black/50">
          <div className="profile-card-image-container relative overflow-hidden">
            <img
              src={imageSrc}
              alt={name}
              className="profile-card-image-scale aspect-square w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/35 to-transparent dark:from-black/65" />
            <div className="absolute left-6 top-6">
              <h2 className="text-2xl font-medium text-white drop-shadow-lg">
                {name}
              </h2>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="profile-card-hover-scale-sm h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-gray-200 dark:ring-zinc-700">
                <img
                  src={avatarSrc}
                  alt={`${name} avatar`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="profile-card-hover-translate min-w-0">
                <div className="truncate text-sm text-gray-700 dark:text-zinc-200">
                  {handle}
                </div>
                <div className="text-xs text-gray-500 dark:text-zinc-500">
                  {timestamp}
                </div>
              </div>
            </div>
            <button
              onClick={onAction}
              className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-all duration-500 ease-out hover:scale-105 hover:bg-gray-800 hover:shadow-md active:scale-95 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:hover:shadow-lg dark:hover:shadow-black/50"
              type="button"
            >
              {actionLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export const Component = ProfileCard

export default Component
