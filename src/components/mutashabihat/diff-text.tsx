import { Fragment } from "react";

const MARK = "rounded-md px-0.5 group-data-[diff=on]/diff:bg-gold/30 group-data-[diff=on]/diff:text-brand";

/** Words with a parallel "differs" flag; highlighted only while the diff toggle is on. */
export function DiffWords({ words, diff }: { words: string[]; diff: boolean[] }) {
  return words.map((w, i) => (
    <Fragment key={i}>
      {diff[i] ? <mark className={`bg-transparent text-inherit ${MARK}`}>{w}</mark> : w}{" "}
    </Fragment>
  ));
}

/** Curated text where the differing words are wrapped in ⟦ ⟧. */
export function BracketText({ text }: { text: string }) {
  return text.split(/(⟦[^⟧]*⟧)/).map((part, i) =>
    part.startsWith("⟦") ? (
      <mark key={i} className={`bg-transparent text-inherit ${MARK}`}>{part.slice(1, -1)}</mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
