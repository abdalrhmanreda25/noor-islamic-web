import type { ReactNode } from "react";
import type { SeerahBlock } from "@/lib/data/seerah";
import { ACCENT } from "./shared";
import { cn } from "@/lib/utils";

const INLINE = /﴿[^﴾]*﴾|"[^"\n]{2,}"/g;

/** Quran (﴿…﴾) in the Hafs face, quoted speech ("…") tinted, as the app's _rich. */
function Rich({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let at = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > at) out.push(text.slice(at, m.index));
    const part = m[0];
    out.push(
      part.startsWith("﴿") ? (
        <span key={m.index} className={cn("quran-text text-[1.12em] leading-[inherit]", ACCENT)}>{part}</span>
      ) : (
        <span key={m.index} className="font-semibold text-(--seerah-quote)">{part}</span>
      ),
    );
    at = m.index + part.length;
  }
  if (at < text.length) out.push(text.slice(at));
  return <>{out}</>;
}

/** One block of a lesson (the app's SeerahBlockView). Sizes are in em so the reader's font scale applies. */
export function BlockView({ block }: { block: SeerahBlock }) {
  switch (block.t) {
    case "h":
      return <h2 className={cn("mt-6 mb-2 text-[1.15em] leading-normal font-extrabold", ACCENT)}>{block.x}</h2>;
    case "s":
      return (
        <h3 className={cn("mt-5 mb-1.5 flex items-start gap-2 text-[1.03em] leading-normal font-bold", ACCENT)}>
          <span className="mt-[0.2em] h-[1.1em] w-1 shrink-0 rounded-full bg-gold" />
          {block.x}
        </h3>
      );
    case "b":
      return (
        <p className="mb-1.5 flex gap-2.5">
          <span className="mt-[0.85em] size-[7px] shrink-0 rounded-full bg-gold" />
          <span><Rich text={block.x} /></span>
        </p>
      );
    case "a":
      return (
        <p className="my-3 rounded-2xl border border-gold/35 bg-secondary/60 px-4 py-3 text-center">
          <Rich text={block.x} />
        </p>
      );
    case "l":
      return (
        <div className="my-2 rounded-xl bg-secondary/60 p-3.5">
          <p className={cn("leading-normal font-extrabold", ACCENT)}>{block.k}</p>
          <p className="mt-1"><Rich text={block.x} /></p>
        </div>
      );
    default:
      return <p className="mb-3"><Rich text={block.x} /></p>;
  }
}
