// Converts the Flutter app's bundled data (Dart const lists + JSON assets)
// into compact JSON files under ./data that the Next.js server components read
// at build time.
//
// Usage: node scripts/convert-data.mjs [path-to-flutter-repo]
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(
  process.argv[2] ?? "../../Flutter/noon-islamic-android",
);
const OUT = path.resolve("data");
const read = (p) => fs.readFileSync(path.join(SRC, p), "utf8");
const readJson = (p) => JSON.parse(read(p));
const write = (p, v) => {
  const file = path.join(OUT, p);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(v));
};

// Dart `const List x = [...];` literals are valid JS expressions.
const dartConst = (file) => {
  const s = read(`quran-1.2.2/lib/${file}.dart`);
  const body = s.slice(s.indexOf("=") + 1).trim().replace(/;\s*$/, "");
  return new Function(`return ${body}`)();
};

// Remove only this script's outputs: other convert-*.mjs scripts share data/.
for (const p of ["quran", "bukhari"]) fs.rmSync(path.join(OUT, p), { recursive: true, force: true });

// ---------- Quran ----------
const verses = dartConst("quran_text");
const surahMeta = dartConst("surah_data");
const juz = dartConst("juz_data");
const sajdah = dartConst("sajdah_verses");
const pageData = dartConst("page_data");
const pageOf = new Map();
pageData.forEach((ranges, i) =>
  ranges.forEach(({ surah, start, end }) => {
    for (let a = start; a <= end; a++) pageOf.set(`${surah}:${a}`, i + 1);
  }),
);
const surahsJson = readJson("assets/data/surahs.json");
const tafseer = readJson("assets/tafseer/muyassar.json");

const tafseerBy = new Map(tafseer.map((t) => [`${t.sura}:${t.aya}`, t.text]));
const juzOf = (s, a) =>
  juz.find((j) => {
    const r = j.verses[String(s)];
    return r && a >= r[0] && a <= r[1];
  })?.id ?? 1;

write(
  "quran/surahs.json",
  surahMeta.map((m, i) => ({
    number: m.id,
    nameAr: surahsJson[i].name,
    nameShortAr: m.arabic,
    nameEn: surahsJson[i].englishName,
    translationEn: surahsJson[i].englishNameTranslation,
    ayahs: m.aya,
    type: m.place === "Makkah" ? "meccan" : "medinan",
    startPage: surahsJson[i].startPage,
    juz: juzOf(m.id, 1),
  })),
);

for (const m of surahMeta) {
  write(
    `quran/surah/${m.id}.json`,
    verses
      .filter((v) => v.surah_number === m.id)
      .map((v) => ({
        n: v.verse_number,
        text: v.content,
        juz: juzOf(m.id, v.verse_number),
        page: pageOf.get(`${m.id}:${v.verse_number}`),
        sajdah: sajdah[m.id] === v.verse_number || undefined,
        tafseer: tafseerBy.get(`${m.id}:${v.verse_number}`) ?? "",
      })),
  );
}

// ---------- Azkar / tasbeeh / names / nawawi ----------
const azkar = readJson("assets/data/azkar.json");
write(
  "azkar.json",
  Object.entries(azkar).map(([title, items], i) => ({
    id: i + 1,
    title,
    items: items.map((z) => ({
      content: z.content,
      count: Number(z.count) || 1,
      description: z.description || "",
      reference: z.reference || "",
    })),
  })),
);

write(
  "tasbeeh.json",
  readJson("assets/tasbeeh/tabeeh.json")["تسابيح"].map((t) => ({
    content: t.content,
    count: Number(t.count) || 33,
    description: t.description || "",
  })),
);

write("names-of-allah.json", readJson("assets/data/names_of_alluh.json").namesOfAlluh);
write("forty-nawawi.json", readJson("assets/data/forty_nawawi.json"));

console.log(
  `Quran ${surahMeta.length} surahs, azkar ${Object.keys(azkar).length} categories -> ${OUT}`,
);

// ---------- Reciters (full 114-surah recitations only) ----------
const reciters = readJson("assets/data/reciters.json").reciters;
write(
  "reciters.json",
  reciters
    .flatMap((r) =>
      r.moshaf
        .filter((m) => m.surah_total === 114)
        .map((m) => ({ id: `${r.id}-${m.id}`, name: r.name, moshaf: m.name, server: m.server })),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "ar")),
);
