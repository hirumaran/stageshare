import { motion } from "framer-motion"
import { toast } from "sonner"

/* ──────────────────────────────────────────────────────────────
   Brand glyphs — official provider marks, inlined as SVG so the
   social row needs no extra assets. Google/Microsoft keep their
   brand colors; Apple inherits the button's white ink.
   ────────────────────────────────────────────────────────────── */
function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.574l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

function MicrosoftGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 23 23" aria-hidden focusable="false">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M12 1h10v10H12z" />
      <path fill="#00A4EF" d="M1 12h10v10H1z" />
      <path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
  )
}

function AppleGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M17.05 12.04c-.03-2.7 2.2-3.99 2.3-4.06-1.25-1.84-3.2-2.09-3.89-2.12-1.65-.17-3.23.97-4.07.97-.84 0-2.13-.95-3.5-.92-1.8.03-3.46 1.05-4.39 2.66-1.87 3.25-.48 8.06 1.34 10.7.89 1.29 1.95 2.74 3.34 2.69 1.34-.05 1.85-.87 3.47-.87 1.62 0 2.08.87 3.5.84 1.45-.03 2.36-1.32 3.24-2.62 1.02-1.5 1.44-2.95 1.46-3.03-.03-.01-2.8-1.07-2.83-4.25zM14.6 4.2c.74-.9 1.24-2.14 1.1-3.38-1.07.04-2.36.71-3.12 1.61-.68.79-1.28 2.06-1.12 3.27 1.19.09 2.41-.6 3.14-1.5z" />
    </svg>
  )
}

const PROVIDERS = [
  { id: "google", label: "Google", Glyph: GoogleGlyph },
  { id: "microsoft", label: "Microsoft", Glyph: MicrosoftGlyph },
  { id: "apple", label: "Apple", Glyph: AppleGlyph },
] as const

/**
 * SocialAuthButtons — Google / Microsoft / Apple single sign-on options.
 *
 * No provider flow runs on the web yet. Google and Microsoft have an implemented
 * *mobile* path (expo-auth-session → backend `/auth/oauth`), inert until client
 * IDs are registered — see OAUTH_SETUP.md. Apple is UI-only: there is no Apple
 * flow on any platform, so it needs a full implementation (and an OAUTH_SETUP.md
 * entry), not just a client ID. `handleOAuth` is honest about this and is the
 * single place to wire a web redirect once a web client is configured.
 */
function handleOAuth(provider: (typeof PROVIDERS)[number]) {
  toast(`Continue with ${provider.label}`, {
    description: `${provider.label} sign-in is coming soon — use your email to continue for now.`,
  })
}

export function SocialAuthButtons({ disabled = false }: { disabled?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {PROVIDERS.map((p) => (
        <motion.button
          key={p.id}
          type="button"
          onClick={() => handleOAuth(p)}
          disabled={disabled}
          whileHover={disabled ? undefined : { y: -1 }}
          whileTap={disabled ? undefined : { y: 0 }}
          transition={{ duration: 0.18 }}
          className="auth-social focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--av-ember)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--av-canvas)]"
          aria-label={`Continue with ${p.label}`}
        >
          <p.Glyph />
        </motion.button>
      ))}
    </div>
  )
}

/* Hairline divider with a centered label — "or continue with email". */
export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1 bg-[var(--av-border)]" />
      <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-[var(--av-muted)]">
        {label}
      </span>
      <span className="h-px flex-1 bg-[var(--av-border)]" />
    </div>
  )
}
