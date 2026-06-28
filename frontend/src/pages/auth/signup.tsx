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
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup, isLoading } = useAuthStore()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    if (!formData.agreeTerms) {
      toast.error("Please agree to the terms and conditions")
      return
    }

    const success = await signup(formData.email, formData.password, formData.name)
    if (success) {
      toast.success("Account created successfully!")
      navigate("/dashboard")
    }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <h1 className="text-[clamp(1.9rem,3vw,2.3rem)] tracking-[-0.04em] text-[var(--av-text)]">
          Create an account
        </h1>
        <p className="mt-2 text-[15px] text-[var(--av-muted)]">
          Join the Clio community and start sharing resources.
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
          <label htmlFor="name" className="auth-label block">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="auth-field"
            placeholder="Sarah Johnson"
            value={formData.name}
            onChange={handleChange}
            disabled={isLoading}
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="auth-label block">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="auth-field"
            placeholder="you@school.edu"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="auth-label block">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="auth-field"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="auth-label block">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="auth-field"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>

        {/* Not a wrapping <label>: the Terms/Privacy links live inside the text,
            and a label would toggle the checkbox when those links are clicked.
            The checkbox carries its own accessible name via aria-label. */}
        <div className="flex items-start gap-3 pt-1 text-[14px] leading-snug text-[var(--av-muted)]">
          <input
            id="agreeTerms"
            name="agreeTerms"
            type="checkbox"
            checked={formData.agreeTerms}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, agreeTerms: e.target.checked }))
            }
            disabled={isLoading}
            aria-label="I agree to the Terms of Service and Privacy Policy"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded-[4px] accent-[var(--av-ember)]"
          />
          <span>
            I agree to the{" "}
            <Link to="/terms" className="auth-link">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="auth-link">
              Privacy Policy
            </Link>
          </span>
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
            "Creating account…"
          ) : (
            <>
              Create account
              <ArrowRight size={17} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </motion.button>
      </motion.form>

      <motion.p variants={item} className="mt-7 text-center text-[14px] text-[var(--av-muted)]">
        Already have an account?{" "}
        <Link to="/login" className="auth-link">
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  )
}
