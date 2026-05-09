import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { RuleLines } from "@/components/common/RuleLines"
import { useStaggeredEntrance } from "@/hooks/useStaggeredEntrance"

export function PageHeader() {
  const entrance = useStaggeredEntrance(100, 0)

  return (
    <section className="mb-8" style={entrance(0, 400)}>
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[2.5rem] font-normal leading-none tracking-[-0.02em] text-[var(--text-primary)]">
            Overview
          </h1>
          <p className="mt-4 flex flex-wrap items-center gap-2 font-label text-[0.65rem] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
            <span>/</span>
            <span
              className="h-1.5 w-1.5 rounded-full bg-[var(--gold)] [animation:pulseGold_2s_ease-in-out_infinite]"
              aria-hidden="true"
            />
            <span>Data Sourced Live</span>
            <span>/ Resource Network</span>
          </p>
        </div>

        <Link
          to="/catalogue"
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-3 border border-[var(--border-accent)] bg-[var(--gold-glow)] px-5 font-label text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[var(--gold)] transition-[background,transform] duration-200 hover:-translate-y-0.5 hover:bg-[var(--gold-dim)] focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] md:self-start"
        >
          Browse Catalogue
          <ArrowRight className="h-4 w-4" strokeWidth={1} aria-hidden="true" />
        </Link>
      </div>

      <RuleLines />
    </section>
  )
}
