import { Link } from "react-router-dom"
import { Container } from "./landing-primitives"
import { Wordmark } from "./landing-brand"

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Insights", href: "#insights" },
      { label: "Catalogue", href: "/signup" },
      { label: "Pricing", href: "/signup" },
    ],
  },
  {
    title: "Who it's for",
    links: [
      { label: "Teachers", href: "#teachers" },
      { label: "Directors", href: "#teachers" },
      { label: "Districts", href: "#districts" },
      { label: "Arts coordinators", href: "#districts" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/" },
      { label: "Contact", href: "/" },
      { label: "Privacy", href: "/" },
      { label: "Terms", href: "/" },
    ],
  },
]

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--border-default)] pb-10 pt-16">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-4 text-[14px] leading-[1.6] text-[var(--text-muted)]">
              The resource network for K-12 theatre. Turning scattered storage rooms into a
              connected, collaborative stage.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="lp-eyebrow">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => {
                  const isAnchor = l.href.startsWith("#")
                  const cls =
                    "text-[14.5px] tracking-[-0.01em] text-[var(--text-secondary)] transition-colors hover:text-[var(--ember)]"
                  return (
                    <li key={l.label}>
                      {isAnchor ? (
                        <a href={l.href} className={cls}>
                          {l.label}
                        </a>
                      ) : (
                        <Link to={l.href} className={cls}>
                          {l.label}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-[var(--border-default)] pt-6 sm:flex-row sm:items-center">
          <p className="text-[13px] text-[var(--text-muted)]">
            © {new Date().getFullYear()} Clio. Made for theatre educators.
          </p>
          <p className="text-[13px] text-[var(--text-muted)]">
            Named for the muse — built for the makers.
          </p>
        </div>
      </Container>
    </footer>
  )
}
