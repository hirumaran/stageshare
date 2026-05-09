import { useStaggeredEntrance } from "@/hooks/useStaggeredEntrance"

const ruleWidths = ["w-full", "w-3/5", "w-[30%]"]

export function RuleLines() {
  const entrance = useStaggeredEntrance(200, 80)

  return (
    <div className="space-y-2.5" aria-hidden="true">
      {ruleWidths.map((width, index) => (
        <div
          key={width}
          className={`${width} h-px bg-[var(--border-default)]`}
          style={entrance(index, 600, "scaleXIn")}
        />
      ))}
    </div>
  )
}
