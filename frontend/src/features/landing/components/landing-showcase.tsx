import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Eyebrow } from "./landing-primitives"

const EASE = [0.22, 1, 0.36, 1] as const

type Item = {
  name: string
  category: string
  school: string
  status: "available" | "on-loan"
  detail: string
}

const ITEMS: Item[] = [
  { name: "Victorian gown", category: "Costumes", school: "Newport HS", status: "available", detail: "Available now" },
  { name: "Wireless lav mics ×4", category: "Sound", school: "Sammamish HS", status: "on-loan", detail: "Due Mar 14" },
  { name: "Forest backdrop", category: "Set pieces", school: "Big Picture", status: "available", detail: "Available now" },
  { name: "Edwardian tea set", category: "Props", school: "Newport HS", status: "available", detail: "Available now" },
]

/**
 * Catalogue preview — text-based "project tile" cards on white.
 * Hairline borders define the edges (no shadow); coral is used functionally
 * to flag availability, paired with a text label so meaning never relies on
 * color alone.
 */
export function LandingShowcase() {
  return (
    <section className="w-full">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <Eyebrow className="mb-4">The catalogue</Eyebrow>
            <h2 className="max-w-md text-[clamp(1.6rem,3.5vw,2.5rem)] leading-[1.1] tracking-[-0.03em] font-medium text-[var(--text-primary)]">
              Browse what every school can share.
            </h2>
          </div>
          <Link
            to="/catalogue"
            className="group inline-flex items-center gap-2 text-[14px] tracking-[-0.01em] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Browse the full catalogue
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border-subtle)] border border-[var(--border-subtle)] rounded-[4px] overflow-hidden">
          {ITEMS.map((item, i) => (
            <motion.article
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.06 }}
              className="landing-lift flex flex-col justify-between gap-10 bg-[var(--background)] p-6 hover:bg-[var(--bg-subtle)]"
            >
              <p className="text-[12px] tracking-[-0.01em] text-[var(--primary)]">{item.category}</p>
              <div>
                <h3 className="text-[18px] leading-[1.2] tracking-[-0.02em] font-medium text-[var(--text-primary)]">
                  {item.name}
                </h3>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      item.status === "available" ? "bg-[var(--primary)]" : "bg-[var(--text-muted)]"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="text-[13px] tracking-[-0.01em] text-[var(--text-muted)]">
                    {item.detail} · {item.school}
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
