import { MessageSquareText, Sparkles } from "lucide-react"

export function EmptyState() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden p-8 text-center">
      <div className="pointer-events-none absolute inset-8 border-[3px] border-black/10" />
      <div className="pointer-events-none absolute left-10 top-10 h-24 w-24 rotate-6 border-[3px] border-black bg-[#ffc425]" />
      <div className="pointer-events-none absolute bottom-12 right-16 hidden h-20 w-40 -rotate-3 border-[3px] border-black bg-[#7ed7c1] md:block" />

      <div className="relative border-[4px] border-black bg-[#fbfaf7] p-8 shadow-[10px_10px_0_#000]">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center border-[3px] border-black bg-[#ffc425]">
          <MessageSquareText className="h-8 w-8 text-black" aria-hidden="true" />
        </div>
        <div className="mb-4 inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.18em]">
          <Sparkles className="h-4 w-4" />
          Pick a thread
        </div>
        <p className="max-w-md text-[clamp(2.4rem,6vw,5rem)] font-black uppercase leading-[0.9] text-black">
          Start the conversation
        </p>
        <p className="mx-auto mt-4 max-w-sm text-base font-medium leading-relaxed text-black/65">
          Choose a chat to coordinate pickups, sizing notes, borrowed pieces, and production hand-offs.
        </p>
      </div>
    </div>
  )
}
