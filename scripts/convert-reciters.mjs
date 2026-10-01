// Builds data/reciters/reciters.json: every reciter with ALL of their moshafs
// (the shared data/reciters.json keeps only complete 114-surah ones).
// Source: the live mp3quran catalog (the API the app's asset was exported
// from, which lists every moshaf), falling back to the Flutter asset
// assets/data/reciters.json when offline. English names come from the same
// API with language=eng and fall back to Arabic.
//
// Usage: node scripts/convert-reciters.mjs [path-to-flutter-repo]
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2] ?? "../../Flutter/noon-islamic-android");
const OUT = path.resolve("data/reciters");
const API = "https://www.mp3quran.net/api/v3/reciters?language=";
const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

let source;
try {
  source = (await fetchJson(API + "ar")).reciters;
} catch (e) {
  console.warn(`mp3quran catalog unavailable (${e.message}); using the Flutter asset`);
  source = JSON.parse(fs.readFileSync(path.join(SRC, "assets/data/reciters.json"), "utf8")).reciters;
}

const en = { reciters: new Map(), moshafs: new Map() };
try {
  for (const r of (await fetchJson(API + "eng")).reciters) {
    en.reciters.set(r.id, r.name.trim());
    for (const m of r.moshaf) en.moshafs.set(m.id, m.name.trim());
  }
} catch (e) {
  console.warn(`English names unavailable (${e.message}); using Arabic only`);
}

const fixUrl = (u) => {
  const [scheme, rest] = u.trim().split("://");
  const url = `${scheme}://${rest.replace(/\/{2,}/g, "/")}`;
  return url.endsWith("/") ? url : `${url}/`;
};

// Compress "1,2,3,...,114" into [[1,114]] ranges to keep the file small.
const ranges = (list) => {
  const nums = list.split(",").map(Number).filter(Boolean).sort((a, b) => a - b);
  const out = [];
  for (const n of nums) {
    const last = out.at(-1);
    if (last && last[1] === n - 1) last[1] = n;
    else out.push([n, n]);
  }
  return out;
};

const reciters = source
  .map((r) => ({
    id: r.id,
    name: r.name.trim(),
    nameEn: en.reciters.get(r.id) ?? r.name.trim(),
    moshaf: r.moshaf
      .map((m) => ({
        id: m.id,
        name: m.name.trim(),
        nameEn: en.moshafs.get(m.id) ?? m.name.trim(),
        server: fixUrl(m.server),
        total: m.surah_total,
        surahs: ranges(m.surah_list),
      }))
      .filter((m) => m.surahs.length)
      .sort((a, b) => b.total - a.total),
  }))
  .filter((r) => r.moshaf.length)
  .sort((a, b) => a.name.localeCompare(b.name, "ar"));

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "reciters.json"), JSON.stringify(reciters));
console.log(`${reciters.length} reciters, ${reciters.reduce((n, r) => n + r.moshaf.length, 0)} moshafs -> ${OUT}`);
