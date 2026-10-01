// Build-time data access. The JSON under /data is generated from the Flutter
// app's assets by scripts/convert-data.mjs; only server components import this.
import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

const DATA_DIR = path.join(process.cwd(), "data");

const load = cache(async <T>(file: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(DATA_DIR, file), "utf8")),
);

export type Surah = {
  number: number;
  nameAr: string;
  nameShortAr: string;
  nameEn: string;
  translationEn: string;
  ayahs: number;
  type: "meccan" | "medinan";
  startPage: number;
  juz: number;
};

export type Ayah = {
  n: number;
  text: string;
  juz: number;
  page: number;
  sajdah?: boolean;
  tafseer: string;
};

export type Reciter = { id: string; name: string; moshaf: string; server: string };

export type ZikrCategory = {
  id: number;
  title: string;
  items: { content: string; count: number; description: string; reference: string }[];
};

export type Tasbeeh = { content: string; count: number; description: string };

export type NameOfAllah = {
  nameOfAllah: string;
  en: string;
  meaning: string;
  effect: string;
  evidence: { surah: number; ayah: number; word: string };
};

export type NawawiHadith = {
  number: number;
  title: string;
  text: string;
  narrator: string;
  source: string;
  explanation: string;
  topics: string[];
  benefits: string[];
};

export const getSurahs = () => load<Surah[]>("quran/surahs.json");
export const getSurahAyahs = (n: number) => load<Ayah[]>(`quran/surah/${n}.json`);
export const getReciters = () => load<Reciter[]>("reciters.json");
export const getAzkar = () => load<ZikrCategory[]>("azkar.json");
export const getTasbeeh = () => load<Tasbeeh[]>("tasbeeh.json");
export const getNamesOfAllah = () => load<NameOfAllah[]>("names-of-allah.json");
export const getNawawi = () => load<NawawiHadith[]>("forty-nawawi.json");

/** Deterministic "ayah of the day" so server and client agree for a given date. */
export async function getAyahOfDay(date = new Date()) {
  const surahs = await getSurahs();
  const day = Math.floor(date.getTime() / 86_400_000);
  let index = (day * 2654435761) % 6236;
  for (const s of surahs) {
    if (index < s.ayahs) {
      const ayah = (await getSurahAyahs(s.number))[index];
      return { surah: s, ayah };
    }
    index -= s.ayahs;
  }
  throw new Error("unreachable");
}
