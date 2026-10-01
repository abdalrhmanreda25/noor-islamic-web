// Build-time access to the mutashabihat data written by scripts/convert-mutashabihat.mjs.
import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { getSurahAyahs } from "@/lib/data";

const DATA_DIR = path.join(process.cwd(), "data", "mutashabihat");

const load = cache(async <T>(file: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(DATA_DIR, file), "utf8")),
);

export type MutashabihGroup = {
  id: string;
  title: string;
  note: string;
  tip: string;
  /** `text` wraps the differing words in ⟦ ⟧. */
  verses: { location: string; text: string }[];
};

export type MutashabihatGroups = { title: string; subtitle: string; hint: string; groups: MutashabihGroup[] };

/** [target "S:A" | "S:A-B", flags, own span when the queried ayah is part of a passage] */
type RawMatch = [string, number, string?];

type MutashabihatIndex = {
  source: { name: string; author: string; url: string; license: string };
  stats: { ayat: number; surahs: number; matches: number };
  ayat: Record<string, RawMatch[]>;
};

export const getMutashabihatGroups = () => load<MutashabihatGroups>("groups.json");
export const getMutashabihatIndex = () => load<MutashabihatIndex>("index.json");

export type Span = { surah: number; first: number; last: number };

const parseSpan = (key: string): Span => {
  const [s, range] = key.split(":");
  const [first, last = first] = range.split("-").map(Number);
  return { surah: Number(s), first, last };
};

const NEXT_AYAH = 4;
const PREVIOUS_AYAH = 8;

/** Per-surah totals for the "all mutashabihat" list. */
export async function getMutashabihatSurahCounts() {
  const counts = new Map<number, { ayat: number; matches: number }>();
  for (const [key, matches] of Object.entries((await getMutashabihatIndex()).ayat)) {
    const surah = Number(key.split(":")[0]);
    const c = counts.get(surah) ?? { ayat: 0, matches: 0 };
    c.ayat++;
    c.matches += matches.length;
    counts.set(surah, c);
  }
  return [...counts].sort((a, b) => a[0] - b[0]).map(([surah, c]) => ({ surah, ...c }));
}

export type SpanText = Span & { text: string };

async function spanText(span: Span): Promise<SpanText> {
  const ayahs = await getSurahAyahs(span.surah);
  const last = Math.min(span.last, ayahs.length);
  const first = Math.max(1, span.first);
  return { surah: span.surah, first, last, text: ayahs.slice(first - 1, last).map((a) => a.text).join(" ") };
}

export type SurahMutashabih = {
  ayah: number;
  text: string;
  matches: { own: SpanText; target: SpanText; next: boolean; previous: boolean }[];
};

/** Ayat of `surah` that have similar ayat, each with the passages to compare. */
export async function getSurahMutashabihat(surah: number): Promise<SurahMutashabih[]> {
  const { ayat } = await getMutashabihatIndex();
  const ayahs = await getSurahAyahs(surah);
  const result: SurahMutashabih[] = [];
  for (const a of ayahs) {
    const raw = ayat[`${surah}:${a.n}`];
    if (!raw) continue;
    const matches = await Promise.all(
      raw.map(async ([target, flags, own]) => {
        const next = (flags & NEXT_AYAH) !== 0;
        const previous = (flags & PREVIOUS_AYAH) !== 0;
        const grow = (s: Span): Span => ({ ...s, first: s.first - (previous ? 1 : 0), last: s.last + (next ? 1 : 0) });
        return {
          own: await spanText(grow(own ? parseSpan(own) : { surah, first: a.n, last: a.n })),
          target: await spanText(grow(parseSpan(target))),
          next,
          previous,
        };
      }),
    );
    result.push({ ayah: a.n, text: a.text, matches });
  }
  return result;
}
