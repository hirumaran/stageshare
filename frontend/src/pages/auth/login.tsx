import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { SocialAuthButtons, AuthDivider } from "@/components/auth/social-auth"
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

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error("Please fill in all fields")
      return
    }

    const success = await login(email, password)
    if (success) {
      toast.success("Welcome back!")
      navigate("/dashboard")
    }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <h1 className="text-[clamp(1.9rem,3vw,2.3rem)] tracking-[-0.04em] text-[var(--av-text)]">
          Welcome back
        </h1>
        <p className="mt-2 text-[15px] text-[var(--av-muted)]">
          Sign in to your Clio account.
        </p>
      </motion.div>

      <motion.div variants={item} className="mt-8">
        <SocialAuthButtons disabled={isLoading} />
      </motion.div>

      <motion.div variants={item} className="my-6">
        <AuthDivider label="or" />
      </motion.div>

      <motion.form variants={item} onSubmit={handleSubmit} className="space-y-4">
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="auth-label block">
              Password
            </label>
            <Link to="/forgot-password" className="auth-link text-[13px]">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            className="auth-field"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="current-password"
          />
        </div>

        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={isLoading ? undefined : { y: -1 }}
          whileTap={isLoading ? undefined : { y: 0 }}
          transition={{ duration: 0.18 }}
          className="auth-btn group mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--av-ember)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--av-canvas)]"
        >
          {isLoading ? (
            "Signing in…"
          ) : (
            <>
              Sign in
              <ArrowRight size={17} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </motion.button>
      </motion.form>

      <motion.p variants={item} className="mt-7 text-center text-[14px] text-[var(--av-muted)]">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="auth-link">
          Sign up
        </Link>
      </motion.p>

      <motion.div
        variants={item}
        className="mt-6 rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] px-4 py-3 text-[13px] text-[var(--av-muted)]"
      >
        <p className="font-medium text-[var(--av-text-secondary)]">Demo mode</p>
        <p className="mt-0.5">Enter any email and password to sign in.</p>
      </motion.div>
    </motion.div>
  )
}
