// Builds data/radio/stations.json from the mp3quran radios API (the same
// stream catalog the app's islamic_channels package ships), with Arabic and
// English names merged by stream URL and a category derived from the URL slug
// exactly like lib/features/radio/data/radio_station.dart.
//
// Usage: node scripts/convert-radio.mjs
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("data/radio");
const API = "https://www.mp3quran.net/api/v3/radios?language=";

const fetchRadios = async (lang) => {
  const res = await fetch(API + lang);
  if (!res.ok) throw new Error(`radios ${lang}: HTTP ${res.status}`);
  return (await res.json()).radios;
};

const CATEGORIES = {
  tafseer: "tafsir", mukhtasartafsir: "tafsir", tabri: "tafsir", "gareeb-quran": "tafsir",
  alaikhtiarat_alfiqhayh_bin_baz: "tafsir", fatwa: "tafsir",
  "saheh-muslim": "hadith", "saheh-bokharee": "hadith", riyad: "hadith", alanbiya: "hadith",
  sahabah: "hadith", fi_zilal_alsiyra: "hadith", almukhtasar_fi_alsiyra: "hadith",
  athkar_sabah: "athkar", athkar_masa: "athkar", roqiah: "athkar", sakeenah: "athkar", ramadan: "athkar",
};

const [ar, en] = await Promise.all([fetchRadios("ar"), fetchRadios("eng")]);
const enByUrl = new Map(en.map((r) => [r.url.trim(), r.name.trim()]));
const seen = new Set();
const stations = [];
for (const r of ar) {
  const url = r.url.trim();
  if (!url.startsWith("http") || seen.has(url)) continue;
  seen.add(url);
  const slug = url.split("/").filter(Boolean).at(-1).toLowerCase();
  stations.push({
    id: r.id,
    url,
    slug,
    category: slug.startsWith("translation_quran") ? "translations" : (CATEGORIES[slug] ?? "recitations"),
    name: r.name.trim(),
    nameEn: (enByUrl.get(url) ?? r.name.trim()).replace(/^Radio\s+/i, ""),
  });
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "stations.json"), JSON.stringify(stations));
console.log(`${stations.length} stations -> ${OUT}`);
