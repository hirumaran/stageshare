import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, Check, Loader2 } from "lucide-react"
import { Container, Eyebrow } from "./landing-primitives"
import { Reveal } from "./landing-motion"
import { submitContactForm } from "../lib/contact"

export function LandingCta() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [error, setError] = useState("")

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || state === "loading") return
    setState("loading")
    const res = await submitContactForm({
      name: "",
      email,
      organization: "",
      role: "Landing — early access",
      message: "Requested early access from the landing page.",
    })
    if (res.ok) {
      setState("done")
    } else {
      setState("error")
      setError(res.error ?? "Something went wrong.")
    }
  }

  return (
    <section className="px-4 pb-6">
      <div
        className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[28px] px-6 py-20 sm:px-12 sm:py-28 lg:py-32"
        style={{ background: "var(--stage)" }}
      >
        {/* single justified spotlight */}
        <div className="lp-spotlight pointer-events-none absolute inset-0" aria-hidden />

        <Container className="relative !px-0 text-center">
          <Reveal>
            <div className="flex justify-center">
              <Eyebrow onDark>The encore</Eyebrow>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              className="mx-auto mt-6 max-w-3xl text-[clamp(2.2rem,5.2vw,4rem)] font-semibold leading-[1.0] tracking-[-0.04em]"
              style={{ color: "var(--primary-foreground)" }}
            >
              Bring the whole district&apos;s theatre to life.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-[1.6] text-[rgba(250,246,239,0.65)]">
              Start digitizing your storage room today, or get your district connected.
              Free to start — no setup fees, no contracts.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            {state === "done" ? (
              <div className="mx-auto mt-10 flex w-fit items-center gap-2.5 rounded-full bg-[rgba(250,246,239,0.1)] px-5 py-3.5 text-[15px] text-[var(--primary-foreground)]">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: "var(--ember)" }}
                >
                  <Check size={14} strokeWidth={2.5} className="text-white" />
                </span>
                You&apos;re on the list — we&apos;ll be in touch shortly.
              </div>
            ) : (
              <form
                onSubmit={onSubmit}
                className="mx-auto mt-10 flex w-full max-w-md flex-col items-stretch gap-2.5 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (state === "error") setState("idle")
                  }}
                  placeholder="you@school.edu"
                  className="h-12 flex-1 rounded-full border border-[rgba(250,246,239,0.18)] bg-[rgba(250,246,239,0.06)] px-5 text-[15px] text-[var(--primary-foreground)] placeholder:text-[rgba(250,246,239,0.4)] focus:border-[var(--ember)] focus:outline-none"
                  aria-label="Work email"
                />
                <motion.button
                  type="submit"
                  disabled={state === "loading"}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium tracking-[-0.01em] text-white transition-[filter] hover:brightness-95 disabled:opacity-70"
                  style={{ background: "var(--ember)" }}
                >
                  {state === "loading" ? (
                    <Loader2 size={17} strokeWidth={2} className="animate-spin" />
                  ) : (
                    <>
                      Request early access
                      <ArrowRight size={16} strokeWidth={2} />
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </Reveal>

          {state === "error" && (
            <p className="mt-3 text-[13px] text-[#ffb4a4]">{error}</p>
          )}

          <Reveal delay={0.2}>
            <p className="mt-6 text-[14px] text-[rgba(250,246,239,0.55)]">
              or{" "}
              <Link
                to="/signup"
                className="font-medium text-[var(--primary-foreground)] underline decoration-[rgba(250,246,239,0.4)] underline-offset-4 transition-colors hover:decoration-[var(--ember)]"
              >
                create your free account
              </Link>{" "}
              now
            </p>
          </Reveal>
        </Container>
      </div>
    </section>
  )
}
