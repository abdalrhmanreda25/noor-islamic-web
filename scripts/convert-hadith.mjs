// Builds data/hadith/ from the Flutter app's hadith assets: book lists come
// from the bundled assets, hadith bodies from the same remote archives the app
// downloads on first open.
//
// Output:
//   data/hadith/collections.json        collection metadata + counts
//   data/hadith/<collection>/books.json  books of a collection
//   data/hadith/<collection>/<book>.json hadiths of a book
//
// Usage: node scripts/convert-hadith.mjs [path-to-flutter-repo]
// Set HADITH_CACHE=<dir> to reuse downloaded archives between runs.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const SRC = path.resolve(process.argv[2] ?? "../../Flutter/noon-islamic-android");
const OUT = path.resolve("data/hadith");
const BASE = "https://github.com/Eslam-Aped-Ali/quran_model/releases/download/assets-v1/";
const CACHE = process.env.HADITH_CACHE;

// Mirrors lib/features/hadith/data/models/hadith_collection.dart
const COLLECTIONS = [
  { id: "bukhari", nameAr: "صحيح البخاري", nameEn: "Sahih al-Bukhari", authorAr: "الإمام محمد بن إسماعيل البخاري", authorEn: "Imam Muhammad ibn Ismail al-Bukhari", booksAsset: "assets/data/bukhari/books.json", sunnahCom: true },
  { id: "muslim", nameAr: "صحيح مسلم", nameEn: "Sahih Muslim", authorAr: "الإمام مسلم بن الحجاج النيسابوري", authorEn: "Imam Muslim ibn al-Hajjaj" },
  { id: "abudawud", nameAr: "سنن أبي داود", nameEn: "Sunan Abi Dawud", authorAr: "الإمام أبو داود السجستاني", authorEn: "Imam Abu Dawud as-Sijistani", gradedByAr: "الألباني", gradedByEn: "Al-Albani" },
  { id: "tirmidhi", nameAr: "جامع الترمذي", nameEn: "Jami' at-Tirmidhi", authorAr: "الإمام أبو عيسى الترمذي", authorEn: "Imam Abu Isa at-Tirmidhi", gradedByAr: "الألباني", gradedByEn: "Al-Albani" },
  { id: "nasai", nameAr: "سنن النسائي", nameEn: "Sunan an-Nasa'i", authorAr: "الإمام أحمد بن شعيب النسائي", authorEn: "Imam Ahmad ibn Shu'ayb an-Nasa'i", gradedByAr: "الألباني", gradedByEn: "Al-Albani" },
  { id: "ibnmajah", nameAr: "سنن ابن ماجه", nameEn: "Sunan Ibn Majah", authorAr: "الإمام محمد بن يزيد بن ماجه القزويني", authorEn: "Imam Muhammad ibn Yazid ibn Majah", gradedByAr: "الألباني", gradedByEn: "Al-Albani" },
  { id: "malik", nameAr: "موطأ الإمام مالك", nameEn: "Muwatta Malik", authorAr: "الإمام مالك بن أنس", authorEn: "Imam Malik ibn Anas", gradedByAr: "سليم الهلالي", gradedByEn: "Salim al-Hilali" },
  { id: "ahmed", nameAr: "مسند الإمام أحمد", nameEn: "Musnad Ahmad", authorAr: "الإمام أحمد بن حنبل", authorEn: "Imam Ahmad ibn Hanbal", noteAr: "المتاح: مسانيد أوائل الصحابة فقط", noteEn: "Available: the first Companions' musnads only" },
  { id: "darimi", nameAr: "سنن الدارمي", nameEn: "Sunan ad-Darimi", authorAr: "الإمام عبد الله بن عبد الرحمن الدارمي", authorEn: "Imam Abdullah ibn Abdurrahman ad-Darimi" },
];

// sunnah.com bodies (Bukhari) carry narrator markup and HTML.
const clean = (body = "") =>
  body
    .replace(/\s*\n\s*/g, " ") // source line-wraps inside paragraphs
    .replace(/\[narrator[^\]]*\]/g, "")
    .replace(/\[\/?[a-z]+\]/g, "")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<\/p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
const squish = (s = "") => s.replace(/[ \t]{2,}/g, " ").trim();
const lang = (arr = [], l) => arr.find((x) => x.lang === l) ?? {};
const compact = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== "" && v != null));
const write = (p, v) => {
  const file = path.join(OUT, p);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(v));
};

async function archive(id) {
  const name = `hadith-${id}-v1.json.gz`;
  const cached = CACHE && path.join(CACHE, name);
  let buf;
  if (cached && fs.existsSync(cached)) buf = fs.readFileSync(cached);
  else {
    const res = await fetch(BASE + name);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
    if (cached) {
      fs.mkdirSync(CACHE, { recursive: true });
      fs.writeFileSync(cached, buf);
    }
  }
  return JSON.parse(zlib.gunzipSync(buf).toString("utf8"));
}

fs.rmSync(OUT, { recursive: true, force: true });
const archives = await Promise.all(COLLECTIONS.map((c) => archive(c.id)));

const index = [];
COLLECTIONS.forEach(({ booksAsset, sunnahCom, ...meta }, i) => {
  const data = archives[i];
  const books = JSON.parse(fs.readFileSync(path.join(SRC, booksAsset ?? `assets/data/hadith/books/${meta.id}.json`), "utf8"));
  const list = [];
  for (const b of books) {
    const raw = data[b.bookNumber];
    if (!raw?.length) continue;
    const hadiths = raw.map((h) => {
      if (!sunnahCom) return compact({ number: h.number, ar: squish(h.ar), en: squish(h.en), grade: h.grade?.trim() });
      const ar = lang(h.hadith, "ar");
      const en = lang(h.hadith, "en");
      return compact({
        number: h.hadithNumber,
        ar: clean(ar.body),
        en: clean(en.body),
        chapterAr: clean(ar.chapterTitle),
        chapterEn: clean(en.chapterTitle),
      });
    });
    write(`${meta.id}/${b.bookNumber}.json`, hadiths);
    list.push({
      id: String(b.bookNumber),
      nameAr: lang(b.book, "ar").name?.trim() ?? "",
      nameEn: lang(b.book, "en").name?.trim() ?? "",
      count: hadiths.length,
      first: hadiths.find((h) => h.number)?.number ?? "",
      last: hadiths.findLast((h) => h.number)?.number ?? "",
    });
  }
  write(`${meta.id}/books.json`, list);
  index.push({ ...meta, books: list.length, hadiths: list.reduce((n, b) => n + b.count, 0) });
  console.log(`${meta.id}: ${list.length} books, ${index.at(-1).hadiths} hadiths`);
});
write("collections.json", index);
