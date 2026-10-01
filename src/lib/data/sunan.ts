// Sunan content, generated from the Flutter app by scripts/convert-sunan.mjs.
import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

export type SunnahItem = {
  title: string;
  /** Hadith text; absent for Quran passages. */
  text?: string;
  /** Quran verses (ayah number + Uthmanic text). */
  verses?: { n: number; text: string }[];
  /** Hadith source, or "سورة X n-m" for Quran passages. */
  reference?: string;
  note?: string;
  featured?: boolean;
};

export type SunnahGroup = { title?: string; items: SunnahItem[] };
export type TrackedSunnah = { id: string; label: string; rakaat: number };
export type SunanTab = "rawatib" | "nawafil" | "daily" | "divine";
export type SunanData = { tracked: TrackedSunnah[]; tabs: Record<SunanTab, SunnahGroup[]> };

export const getSunan = cache(
  async (): Promise<SunanData> =>
    JSON.parse(await fs.readFile(path.join(process.cwd(), "data/sunan/sunan.json"), "utf8")),
);
