// Builds data/daily-content/ for "Verse & Hadith of the Day", mirroring
// lib/features/daily_content/data/services/daily_content_repository.dart:
//   - ayah of day N = verse (N % 6236) of the mushaf, skipping verses longer
//     than 300 chars by advancing to the next one;
//   - hadith of day N = pool[N % pool.length], the pool being Sahih al-Bukhari
//     Arabic texts of at most 400 chars, books in numeric order;
//   - dua / dhikr of day N cycle through the curated Dart lists.
// The ayah and hadith pools are chunked so the client fetches ~one small file
// per day shown.
//
// Needs data/quran (scripts/convert-data.mjs) and data/hadith
// (scripts/convert-hadith.mjs) first.
// Usage: node scripts/convert-daily-content.mjs [path-to-flutter-repo]
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2] ?? "../../Flutter/noon-islamic-android");
const DATA = path.resolve("data");
const OUT = path.join(DATA, "daily-content");
const CHUNK = 200;
const MAX_AYAH = 300;
const MAX_HADITH = 400;
const PAGE_SIZE = 50; // HADITH_PAGE_SIZE in src/lib/data/hadith.ts

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(DATA, p), "utf8"));
const write = (p, v) => {
  const file = path.join(OUT, p);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(v));
};
const chunked = (dir, list) => {
  for (let i = 0; i * CHUNK < list.length; i++) write(`${dir}/${i}.json`, list.slice(i * CHUNK, (i + 1) * CHUNK));
};
const arabicDigits = (n) => String(n).replace(/\d/g, (d) => String.fromCharCode(0x660 + Number(d)));

fs.rmSync(OUT, { recursive: true, force: true });

// ---------- Ayahs ----------
const surahs = readJson("quran/surahs.json");
const verses = surahs.flatMap((s) =>
  readJson(`quran/surah/${s.number}.json`).map((a) => ({ s: s.number, a: a.n, text: a.text, tafseer: a.tafseer })),
);
// Entry i is already the verse day-index i resolves to (long verses skipped).
const ayahPool = verses.map((_, i) => {
  for (let k = 0; k < verses.length; k++) {
    const v = verses[(i + k) % verses.length];
    if (v.text.length <= MAX_AYAH) return v;
  }
  return verses[0];
});
chunked("ayah", ayahPool);

// ---------- Hadiths (Sahih al-Bukhari) ----------
const books = readJson("hadith/bukhari/books.json").sort((a, b) => Number(a.id) - Number(b.id));
const hadithPool = books.flatMap((b) =>
  readJson(`hadith/bukhari/${b.id}.json`).flatMap((h, i) => {
    const ar = h.ar.replace(/\s+/g, " ").trim();
    if (!ar || ar.length > MAX_HADITH) return [];
    return [{ ar, en: h.en, number: h.number, book: b.id, page: Math.floor(i / PAGE_SIZE) + 1 }];
  }),
);
chunked("hadith", hadithPool);

// ---------- Curated duas and adhkar (Dart const lists) ----------
const verseText = (s, a) => verses.find((v) => v.s === s && v.a === a)?.text ?? "";
const surahName = (s) => surahs[s - 1].nameShortAr;

/** Turns a Dart `const List<DailyEntry> x = [...]` literal into JS objects. */
function parseDartEntries(file) {
  let src = fs.readFileSync(path.join(SRC, file), "utf8");
  src = src.slice(src.indexOf("= [") + 2, src.lastIndexOf("];") + 1);
  let out = "";
  const stack = [];
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      out += "\n";
    } else if (c === "'" || c === '"') {
      let j = i + 1;
      while (src[j] !== c) j += src[j] === "\\" ? 2 : 1;
      out += JSON.stringify(src.slice(i + 1, j).replace(/\\(.)/g, "$1"));
      i = j;
      // Dart concatenates adjacent string literals.
      const next = src.slice(i + 1).match(/^\s*(['"])/);
      if (next) out += " +";
    } else if (src.startsWith("DailyEntry(", i)) {
      out += "({";
      stack.push("entry");
      i += "DailyEntry(".length - 1;
    } else if (src.startsWith("QuranRef(", i)) {
      out += "ref(";
      stack.push("call");
      i += "QuranRef(".length - 1;
    } else if (c === "(") {
      out += c;
      stack.push("paren");
    } else if (c === ")") {
      out += stack.pop() === "entry" ? "})" : ")";
    } else out += c;
  }
  const ref = (surah, from, to = from) => ({ surah, from, to });
  return new Function("ref", `return ${out}`)(ref);
}

const toEntry = (e) => {
  if (!e.quranRef) return { id: e.id, text: e.text, plain: e.text, reference: e.source, note: e.note };
  const { surah, from, to } = e.quranRef;
  const ayahs = [];
  for (let a = from; a <= to; a++) ayahs.push({ n: a, text: verseText(surah, a) });
  const span = from === to ? arabicDigits(from) : `${arabicDigits(from)}-${arabicDigits(to)}`;
  return {
    id: e.id,
    quran: { surah, from, to, ayahs },
    plain: `﴿${ayahs.map((v) => `${v.text} (${arabicDigits(v.n)})`).join(" ")}﴾`,
    reference: `سورة ${surahName(surah)}: ${span}`,
    note: e.note,
  };
};

const base = "lib/features/daily_content/data/content";
const duas = parseDartEntries(`${base}/daily_duas.dart`).map(toEntry);
const adhkar = parseDartEntries(`${base}/daily_adhkar.dart`).map(toEntry);
write("entries.json", { duas, adhkar });
write("meta.json", { chunk: CHUNK, ayahs: ayahPool.length, hadiths: hadithPool.length });

console.log(`daily-content: ${ayahPool.length} ayahs, ${hadithPool.length} hadiths, ${duas.length} duas, ${adhkar.length} adhkar`);
