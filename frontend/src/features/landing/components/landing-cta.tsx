import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, Check, Loader2, Plus } from "lucide-react"
import { DotPattern } from "@/registry/aliimam/components/dot-pattern"
import { Container, Eyebrow } from "./landing-primitives"
import { Reveal, Stagger, StaggerItem } from "./landing-motion"
import { SchoolDot, Float } from "./landing-ui"
import { submitContactForm } from "../lib/contact"

const EASE = [0.22, 1, 0.36, 1] as const

/* The finale — "The Encore". A lit stage that bookends the hero: where the page
   opened on a district's resources scattered in the dark (floating catalogue
   cards), it closes on that district assembled and lit on one stage. The dark
   panel is always-on regardless of page theme, so on-stage ink is a fixed cream
   (CREAM) rather than --primary-foreground, which would invert under the
   house-lights-down dark theme. */
const CREAM = "#faf6ef"

/* The connected cast — illustrative sample district, consistent with the hero. */
const CAST = ["Lincoln High", "Roosevelt Middle", "Jefferson High", "Edison Arts"]

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
        className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[28px]"
        style={{ background: "var(--stage)" }}
      >
        {/* the follow-spot, a faint dot-textured "air", and a warm stage floor —
            the same light language as the hero, justified here as a real stage */}
        <div className="lp-spotlight pointer-events-none absolute inset-0" aria-hidden />
        <DotPattern
          width={24}
          height={24}
          cx={1}
          cy={1}
          cr={1}
          className="pointer-events-none z-0 fill-[#faf6ef]/[0.06] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000,transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-44"
          style={{ background: "linear-gradient(to top, rgba(250,92,64,0.10), transparent)" }}
        />
        {/* proscenium hairline */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(250,246,239,0.16), transparent)" }}
        />

        <Container className="relative !px-0">
          <div className="grid items-center gap-12 px-6 py-20 sm:px-12 sm:py-24 lg:grid-cols-[1.04fr_0.96fr] lg:gap-8 lg:py-28">
            {/* ── Left: the call ── */}
            <Stagger className="max-w-xl">
              <StaggerItem>
                <Eyebrow onDark>The encore</Eyebrow>
              </StaggerItem>

              <StaggerItem>
                <h2
                  className="mt-6 text-[clamp(2.2rem,4.6vw,3.8rem)] font-semibold leading-[1.0] tracking-[-0.04em]"
                  style={{ color: CREAM }}
                >
                  Bring the whole district&apos;s theatre to{" "}
                  <span className="relative whitespace-nowrap">
                    life.
                    <svg
                      className="absolute -bottom-1 left-0 w-full"
                      viewBox="0 0 120 12"
                      fill="none"
                      preserveAspectRatio="none"
                      aria-hidden
                    >
                      <motion.path
                        d="M2 8C28 3 92 3 118 7"
                        stroke="var(--ember)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.9, ease: EASE, delay: 0.45 }}
                      />
                    </svg>
                  </span>
                </h2>
              </StaggerItem>

              <StaggerItem>
                <p
                  className="mt-6 max-w-md text-[17px] leading-[1.6]"
                  style={{ color: "rgba(250,246,239,0.66)" }}
                >
                  Start digitizing your storage room today, or get your district connected.
                  Free to start — no setup fees, no contracts.
                </p>
              </StaggerItem>

              {/* sign-up — a single "stage door" object, not a floating box */}
              <StaggerItem>
                {state === "done" ? (
                  <div
                    role="status"
                    className="mt-9 flex w-fit items-center gap-2.5 rounded-full px-5 py-3.5 text-[15px]"
                    style={{ background: "rgba(250,246,239,0.08)", color: CREAM }}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ background: "var(--ember)" }}
                    >
                      <Check size={14} strokeWidth={2.5} className="text-white" />
                    </span>
                    You&apos;re on the list — we&apos;ll be in touch shortly.
                  </div>
                ) : (
                  <form onSubmit={onSubmit} className="mt-9 w-full max-w-md">
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:border sm:border-[rgba(250,246,239,0.14)] sm:bg-[rgba(250,246,239,0.04)] sm:p-1.5 sm:pl-5 sm:transition-colors sm:focus-within:border-[rgba(250,246,239,0.32)]">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (state === "error") setState("idle")
                        }}
                        placeholder="you@school.edu"
                        className="h-12 flex-1 rounded-full border border-[rgba(250,246,239,0.16)] bg-[rgba(250,246,239,0.05)] px-5 text-[15px] outline-none placeholder:text-[rgba(250,246,239,0.4)] focus:border-[var(--ember)] sm:h-10 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:focus:border-0"
                        style={{ color: CREAM }}
                        aria-label="Work email"
                        aria-invalid={state === "error"}
                        aria-describedby={state === "error" ? "cta-email-error" : undefined}
                      />
                      <motion.button
                        type="submit"
                        disabled={state === "loading"}
                        whileHover={{ y: -1 }}
                        whileTap={{ y: 0 }}
                        className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium tracking-[-0.01em] text-white transition-[filter] hover:brightness-95 disabled:opacity-70 sm:h-11"
                        style={{ background: "var(--ember)" }}
                      >
                        {state === "loading" ? (
                          <Loader2 size={17} strokeWidth={2} className="animate-spin" />
                        ) : (
                          <>
                            Request early access
                            <ArrowRight
                              size={16}
                              strokeWidth={2}
                              className="transition-transform group-hover:translate-x-0.5"
                            />
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                )}

                {state === "error" && (
                  <p id="cta-email-error" role="alert" className="mt-3 text-[13px] text-[#ffb4a4]">
                    {error}
                  </p>
                )}
              </StaggerItem>

              <StaggerItem>
                <div className="mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[14px]">
                  <span style={{ color: "rgba(250,246,239,0.55)" }}>
                    or{" "}
                    <Link
                      to="/signup"
                      className="font-medium underline decoration-[rgba(250,246,239,0.4)] underline-offset-4 transition-colors hover:decoration-[var(--ember)]"
                      style={{ color: CREAM }}
                    >
                      create your free account
                    </Link>{" "}
                    now
                  </span>
                </div>
                <p className="mt-4 text-[13px]" style={{ color: "rgba(250,246,239,0.5)" }}>
                  Built for drama teachers · No setup fees · District-ready in a day
                </p>
              </StaggerItem>
            </Stagger>

            {/* ── Right: the marquee, lit. The district assembled on one stage,
                 with an open slot inviting the visitor's school to join. Hidden
                 on small screens so the action path stays the focus. ── */}
            <Reveal delay={0.15} className="hidden lg:block">
              <div className="relative mx-auto w-full max-w-[380px] lg:-translate-y-4" aria-hidden>
                {/* the backdrop, lit — two soft washes of warm stage light, no
                    edges and no stripes: a cream glow the marquee is lit against,
                    and an ember footlight pool grounding it from the floor, so the
                    card reads as standing on a lit stage rather than in void. */}
                <div
                  className="pointer-events-none absolute -inset-x-6 top-2 -bottom-3"
                  style={{
                    background:
                      "radial-gradient(58% 46% at 50% 64%, rgba(250,92,64,0.08), transparent 72%)",
                  }}
                />
                <motion.div
                  className="pointer-events-none absolute -inset-x-2 top-1 bottom-6 blur-2xl"
                  style={{
                    background:
                      "radial-gradient(62% 56% at 50% 34%, rgba(250,246,239,0.07), transparent 72%)",
                  }}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 1, ease: EASE, delay: 0.2 }}
                />
                <Float amplitude={9} duration={7}>
                  <div
                    className="relative overflow-hidden rounded-[22px] border p-6"
                    style={{
                      borderColor: "rgba(250,246,239,0.12)",
                      background: "rgba(250,246,239,0.05)",
                      boxShadow: "0 40px 80px -40px rgba(0,0,0,0.6)",
                    }}
                  >
                    {/* ember marquee bar */}
                    <div className="h-1 w-12 rounded-full" style={{ background: "var(--ember)" }} />
                    <p
                      className="mt-5 text-[11px] font-medium uppercase tracking-[0.22em]"
                      style={{ color: "rgba(250,246,239,0.5)" }}
                    >
                      Now connecting
                    </p>
                    <p className="mt-2 text-[22px] font-semibold tracking-[-0.02em]" style={{ color: CREAM }}>
                      Your district
                    </p>

                    {/* the cast, connected — plus an open slot for the visitor,
                        seated in the same overlapping row so it reads as the
                        next seat, not a detached button */}
                    <div className="mt-6 flex items-center -space-x-2.5">
                      {CAST.map((s) => (
                        <div
                          key={s}
                          className="rounded-full"
                          style={{ boxShadow: "0 0 0 2px var(--stage)" }}
                        >
                          <SchoolDot name={s} size={34} />
                        </div>
                      ))}
                      <span
                        className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-dashed"
                        style={{
                          borderColor: "var(--ember)",
                          background: "rgba(250,92,64,0.10)",
                          boxShadow: "0 0 0 2px var(--stage)",
                        }}
                      >
                        <Plus size={15} strokeWidth={2.5} style={{ color: "var(--ember)" }} />
                      </span>
                    </div>

                    <div
                      className="mt-6 h-px w-full"
                      style={{ background: "rgba(250,246,239,0.10)" }}
                    />
                    <div className="mt-4 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ember)" }} />
                      <span className="text-[13px]" style={{ color: "rgba(250,246,239,0.6)" }}>
                        Curtain up — add your school
                      </span>
                    </div>
                  </div>
                </Float>
              </div>
            </Reveal>
          </div>
        </Container>
      </div>
    </section>
  )
}
