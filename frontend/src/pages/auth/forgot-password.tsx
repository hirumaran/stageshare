import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Mail } from "lucide-react"
import { toast } from "sonner"

const EASE = [0.22, 1, 0.36, 1] as const
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const successHeadingRef = useRef<HTMLHeadingElement>(null)

  // Move focus to the confirmation heading when the view swaps to success, so
  // keyboard/SR users aren't left on the now-unmounted submit button. The
  // success block is also role="status" for an announcement.
  useEffect(() => {
    if (isSubmitted) successHeadingRef.current?.focus()
  }, [isSubmitted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsLoading(false)
    setIsSubmitted(true)
    toast.success("Reset link sent!")
  }

  if (isSubmitted) {
    return (
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="text-center"
        role="status"
        aria-live="polite"
      >
        <motion.div
          variants={item}
          className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--av-border)] bg-[var(--av-surface)]"
        >
          <Mail className="h-5 w-5 text-[var(--av-ember)]" />
        </motion.div>
        <motion.h1
          ref={successHeadingRef}
          tabIndex={-1}
          variants={item}
          className="text-[clamp(1.9rem,3vw,2.3rem)] tracking-[-0.04em] text-[var(--av-text)] outline-none"
        >
          Check your email
        </motion.h1>
        <motion.p variants={item} className="mt-2 text-[15px] text-[var(--av-muted)]">
          We&apos;ve sent a password reset link to{" "}
          <span className="text-[var(--av-text-secondary)]">{email}</span>
        </motion.p>

        <motion.p variants={item} className="mt-6 text-[14px] text-[var(--av-muted)]">
          Didn&apos;t receive the email? Check your spam folder or try again.
        </motion.p>

        <motion.button
          variants={item}
          type="button"
          onClick={() => setIsSubmitted(false)}
          whileHover={{ y: -1 }}
          whileTap={{ y: 0 }}
          transition={{ duration: 0.18 }}
          className="auth-social mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--av-ember)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--av-canvas)]"
        >
          Try another email
        </motion.button>

        <motion.div variants={item} className="mt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-[14px] text-[var(--av-muted)] transition-colors hover:text-[var(--av-text)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <h1 className="text-[clamp(1.9rem,3vw,2.3rem)] tracking-[-0.04em] text-[var(--av-text)]">
          Forgot password?
        </h1>
        <p className="mt-2 text-[15px] text-[var(--av-muted)]">
          No worries — we&apos;ll send you reset instructions.
        </p>
      </motion.div>

      <motion.form variants={item} onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="auth-label block">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="auth-field"
            placeholder="you@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={isLoading ? undefined : { y: -1 }}
          whileTap={isLoading ? undefined : { y: 0 }}
          transition={{ duration: 0.18 }}
          className="auth-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--av-ember)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--av-canvas)]"
        >
          {isLoading ? "Sending…" : "Send reset link"}
        </motion.button>
      </motion.form>

      <motion.div variants={item} className="mt-7 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-[14px] text-[var(--av-muted)] transition-colors hover:text-[var(--av-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </motion.div>
    </motion.div>
  )
}
