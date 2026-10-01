// Build-time access to data/daily-content (scripts/convert-daily-content.mjs).
import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

const DIR = path.join(process.cwd(), "data", "daily-content");

const load = cache(async <T>(file: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(DIR, file), "utf8")),
);

export type DailyAyah = { s: number; a: number; text: string; tafseer: string };
export type DailyHadith = { ar: string; en?: string; number: string; book: string; page: number };
export type DailyEntry = {
  id: string;
  text?: string;
  quran?: { surah: number; from: number; to: number; ayahs: { n: number; text: string }[] };
  plain: string;
  reference: string;
  note?: string;
};
export type DailyMeta = { chunk: number; ayahs: number; hadiths: number };

export const getDailyMeta = () => load<DailyMeta>("meta.json");
export const getDailyEntries = () => load<{ duas: DailyEntry[]; adhkar: DailyEntry[] }>("entries.json");
export const getDailyChunk = (kind: "ayah" | "hadith", chunk: number) =>
  load<DailyAyah[] | DailyHadith[]>(`${kind}/${chunk}.json`);
