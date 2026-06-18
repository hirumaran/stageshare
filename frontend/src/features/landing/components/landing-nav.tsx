import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Button } from "./landing-primitives"
import { Wordmark } from "./landing-brand"
import { useScrollSpy } from "./landing-motion"

const LINKS = [
  { id: "how", label: "How it works" },
  { id: "teachers", label: "For teachers" },
  { id: "districts", label: "For districts" },
  { id: "insights", label: "Insights" },
]

export function LandingNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const active = useScrollSpy(LINKS.map((l) => l.id))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`landing-pill flex w-full max-w-[1180px] items-center justify-between gap-4 px-4 py-2.5 transition-shadow duration-300 sm:px-5 ${
          scrolled ? "shadow-[0_10px_40px_-24px_rgba(20,19,15,0.5)]" : ""
        }`}
      >
        <Link to="/" className="flex items-center gap-2.5 pl-1.5" aria-label="Clio home">
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className="relative rounded-full px-3.5 py-2 text-[14px] font-medium tracking-[-0.01em] transition-colors"
              style={{ color: active === l.id ? "var(--text-primary)" : "var(--text-muted)" }}
            >
              {l.label}
              {active === l.id && (
                <motion.span
                  layoutId="nav-dot"
                  className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                  style={{ background: "var(--ember)" }}
                />
              )}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-full px-4 py-2 text-[14px] font-medium tracking-[-0.01em] text-[var(--text-primary)] transition-colors hover:text-[var(--ember)] sm:block"
          >
            Sign in
          </Link>
          <Button to="/signup" className="hidden px-5 py-2.5 text-[14px] sm:inline-flex">
            Get started
          </Button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)] lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={18} strokeWidth={1.75} /> : <Menu size={18} strokeWidth={1.75} />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-x-4 top-[72px] rounded-3xl border border-[var(--border-default)] bg-[var(--bg-raised)] p-3 shadow-[0_30px_80px_-40px_rgba(20,19,15,0.4)] lg:hidden"
          >
            {LINKS.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 text-[16px] font-medium tracking-[-0.01em] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-[var(--border-default)] pt-3">
              <Button to="/login" variant="secondary" onClick={() => setOpen(false)}>
                Sign in
              </Button>
              <Button to="/signup" onClick={() => setOpen(false)}>
                Get started
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
