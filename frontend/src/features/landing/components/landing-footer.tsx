import { Fragment } from "react"
import { Link } from "react-router-dom"
import { Container } from "./landing-primitives"
import { ClioGrid } from "./landing-brand"

const LINKS: { label: string; href: string }[] = [
  { label: "About", href: "/" },
  { label: "Contact", href: "/" },
  { label: "Privacy", href: "/" },
  { label: "Terms", href: "/" },
]

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--border-default)] pb-12 pt-24 sm:pt-32">
      {/* curtain call — the name fills the full width as the page-ender */}
      <div className="px-4 sm:px-6">
        <ClioGrid />
      </div>

      {/* slim closing strip — essentials only */}
      <Container className="mt-12 flex flex-col items-center gap-3 text-center">
        <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          {LINKS.map((l, i) => (
            <Fragment key={l.label}>
              {i > 0 && (
                <span aria-hidden className="text-[var(--text-muted)] opacity-40">
                  ·
                </span>
              )}
              <Link
                to={l.href}
                className="text-[13px] tracking-[-0.01em] text-[var(--text-muted)] transition-colors hover:text-[var(--ember)]"
              >
                {l.label}
              </Link>
            </Fragment>
          ))}
        </nav>
        <p className="text-[12px] text-[var(--text-muted)]">
          © {new Date().getFullYear()} Clio
        </p>
      </Container>
    </footer>
  )
}
