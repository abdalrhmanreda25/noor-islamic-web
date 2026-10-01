// Build-time tafsir access. Muyassar ships with the Quran data; the other
// books are written per surah by scripts/convert-tafseer.mjs.
import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { getSurahAyahs } from "@/lib/data";

const DATA_DIR = path.join(process.cwd(), "data");

const load = cache(async <T>(file: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(DATA_DIR, file), "utf8")),
);

import type { TafsirBook } from "@/components/tafseer/books";

/** Tafsir text per ayah of `surah` (index = ayah - 1). */
export async function getTafsir(book: TafsirBook, surah: number): Promise<string[]> {
  if (book === "muyassar") return (await getSurahAyahs(surah)).map((a) => a.tafseer);
  return load<string[]>(`tafseer/${book}/${surah}.json`);
}
