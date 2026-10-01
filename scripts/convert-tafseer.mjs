// Downloads the tafsir books the app fetches on demand and writes one compact
// JSON per surah: data/tafseer/<book>/<surah>.json = string[] (index = ayah - 1).
// Muyassar already ships in data/quran/surah/<n>.json (field `tafseer`).
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const BASE = "https://github.com/Eslam-Aped-Ali/quran_model/releases/download/assets-v1/";
const BOOKS = { jalalayn: "jalalayn", "ibn-katheer": "ibn_katheer", qurtubi: "qurtubi" };
const OUT = path.join(process.cwd(), "data", "tafseer");

// The source lost its line breaks: "...عنه .ذكر ما ورد في فضلها :قال". Restore a
// break wherever a full stop, colon or closing bracket runs straight into a letter.
const clean = (s) =>
  s
    .replace(/\r/g, "")
    .replace(/([.:)\]])(?=[ء-ي])/g, "$1\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();

for (const [id, remote] of Object.entries(BOOKS)) {
  const res = await fetch(`${BASE}tafsir-${remote}-v1.json.gz`);
  if (!res.ok) throw new Error(`${remote}: HTTP ${res.status}`);
  const rows = JSON.parse(zlib.gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf8"));
  const bySurah = new Map();
  for (const { surah, verse, text } of rows) {
    if (!bySurah.has(surah)) bySurah.set(surah, []);
    bySurah.get(surah)[verse - 1] = clean(text ?? "");
  }
  fs.mkdirSync(path.join(OUT, id), { recursive: true });
  for (const [surah, list] of bySurah) {
    fs.writeFileSync(path.join(OUT, id, `${surah}.json`), JSON.stringify(Array.from(list, (t) => t ?? "")));
  }
  console.log(`tafseer/${id}: ${rows.length} ayahs in ${bySurah.size} surahs`);
}
