import { Fragment } from "react";
import type { FiqhBlock } from "@/lib/data/fiqh";
import { toLocaleDigits } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { FiqhEvidenceActions } from "./copy-button";

const LIST_NUMBER = /^\s*([0-9٠-٩]+)\s*[)\-.]\s*/;
const AYAH_NUMBER = / ([٠-٩]+)(?= |$)/g;

/** Plain text of a block for copy/share: verse numbers become (n), wrapped in ﴿ ﴾. */
const plainText = (b: FiqhBlock) => {
  const body = b.t === "verse" ? `﴿${b.x.replace(AYAH_NUMBER, " ($1)")}﴾` : b.x;
  return b.r ? `${body}\n\n${b.r}` : body;
};

/** Verse text; the Hafs face draws each bare Arabic-Indic number as the ayah-end ornament. */
function VerseText({ text }: { text: string }) {
  const parts = text.split(AYAH_NUMBER);
  return parts.map((p, i) =>
    i % 2 ? (
      <span key={i} className="ayah-marker mx-0.5">{p}</span>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    ),
  );
}

function EvidenceCard({ block }: { block: FiqhBlock }) {
  const quran = block.t === "verse";
  return (
    <figure
      className={cn(
        "rounded-2xl border-s-4 px-4 pt-4 pb-2",
        quran ? "border-gold bg-gold/10" : "border-brand bg-brand/8",
      )}
    >
      {quran ? (
        <p className="quran-text text-center text-2xl">
          <VerseText text={block.x} />
        </p>
      ) : (
        <p className="text-lg leading-loose font-semibold">{block.x}</p>
      )}
      <figcaption className="mt-2 flex items-center gap-2">
        {block.r && (
          <span className={cn("rounded-full px-3 py-1 text-xs font-bold text-brand", quran ? "bg-gold/20" : "bg-brand/15")}>
            {block.r}
          </span>
        )}
        <span className="flex-1" />
        <FiqhEvidenceActions text={plainText(block)} />
      </figcaption>
    </figure>
  );
}

function ListBlock({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim());
  return (
    <ul className="space-y-2 rounded-2xl border bg-card p-4">
      {lines.map((line, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand/12 text-xs font-extrabold text-brand">
            {line.match(LIST_NUMBER)?.[1] ?? "•"}
          </span>
          <span className="leading-relaxed font-semibold">{line.replace(LIST_NUMBER, "")}</span>
        </li>
      ))}
    </ul>
  );
}

/** Renders one content block by its type (always RTL: the content is Arabic). */
export function FiqhBlockView({ block }: { block: FiqhBlock }) {
  switch (block.t) {
    case "heading":
      return (
        <h2 className="flex items-center gap-2 pt-2 text-lg font-extrabold text-brand">
          <span className="h-5 w-1 shrink-0 rounded-full bg-gold" />
          {block.x}
        </h2>
      );
    case "verse":
    case "hadith":
      return <EvidenceCard block={block} />;
    case "list":
      return <ListBlock text={block.x} />;
    default:
      return <p className="leading-loose whitespace-pre-line text-foreground/90">{block.x}</p>;
  }
}

/** "٣) الطواف" → "الطواف"; the timeline node shows the number. */
const stripNumber = (s: string) => s.replace(LIST_NUMBER, "");

/** Step-by-step topics: blocks before the first heading stay plain; each heading opens a numbered step. */
export function FiqhSteps({ blocks, locale }: { blocks: FiqhBlock[]; locale: string }) {
  const lead: FiqhBlock[] = [];
  const steps: { title: string; body: FiqhBlock[] }[] = [];
  for (const b of blocks) {
    if (b.t === "heading") steps.push({ title: stripNumber(b.x), body: [] });
    else if (!steps.length) lead.push(b);
    else steps[steps.length - 1].body.push(b);
  }
  return (
    <>
      {lead.map((b, i) => <FiqhBlockView key={`l${i}`} block={b} />)}
      <ol className="pt-2">
        {steps.map((s, i) => (
          <li key={i} className="relative flex gap-3 pb-6 last:pb-0">
            {i < steps.length - 1 && (
              <span className="absolute start-[16px] top-10 bottom-1 w-0.5 rounded-full bg-brand/25" />
            )}
            <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">
              {toLocaleDigits(i + 1, locale)}
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <h2 className="pt-1 text-lg font-extrabold text-brand">{s.title}</h2>
              {s.body.map((b, j) => <FiqhBlockView key={j} block={b} />)}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
