// Build-time access to the asbab al-nuzul data written by scripts/convert-asbab-nuzul.mjs.
import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

const DATA_DIR = path.join(process.cwd(), "data", "asbab-nuzul");

const load = cache(async <T>(file: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(DATA_DIR, file), "utf8")),
);

export type AsbabBlock =
  | { type: "verse" | "hadith"; text: string; reference: string }
  | { type: "heading" | "text"; text: string };

export type AsbabTopic = { id: string; question: string; intro: string; blocks: AsbabBlock[] };

export type AsbabCategory = { id: string; title: string; icon: string; subtitle: string; topics: AsbabTopic[] };

export type AsbabTopics = { title: string; subtitle: string; categories: AsbabCategory[] };

export type WahidiSource = { id: string; title: string; author: string; death: string; via: string; url: string };

/** [surah, fromAyah, toAyah, text] */
export type WahidiEntry = [number, number, number, string];

export type Wahidi = { source: WahidiSource; entries: WahidiEntry[] };

export const getAsbabTopics = () => load<AsbabTopics>("topics.json");
export const getWahidi = () => load<Wahidi>("wahidi.json");

/** Surahs al-Wahidi treats but the digital edition lacks (al-Mu'awwidhatayn). */
export const WAHIDI_MISSING_SURAHS = [113, 114];

export async function getAsbabTopic(id: string) {
  for (const category of (await getAsbabTopics()).categories) {
    const topic = category.topics.find((t) => t.id === id);
    if (topic) return { category, topic };
  }
  return null;
}

/** Per-surah counts: entries and distinct ayat covered. */
export async function getWahidiSurahSummaries() {
  const map = new Map<number, { entries: number; ayat: Set<number> }>();
  for (const [surah, from, to] of (await getWahidi()).entries) {
    const s = map.get(surah) ?? { entries: 0, ayat: new Set<number>() };
    s.entries++;
    for (let a = from; a <= to; a++) s.ayat.add(a);
    map.set(surah, s);
  }
  return [...map].map(([surah, s]) => ({ surah, entries: s.entries, ayat: s.ayat.size }));
}
