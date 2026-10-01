// Converts the Flutter Sunan content (lib/features/sunan/data/sunan_content.dart)
// into data/sunan/sunan.json, resolving Quran ayah ranges to verse text from
// data/quran/surah/<n>.json.
//
// Usage: node scripts/convert-sunan.mjs [path-to-flutter-repo]
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2] ?? "../../Flutter/noon-islamic-android");
const dart = fs.readFileSync(path.join(SRC, "lib/features/sunan/data/sunan_content.dart"), "utf8");
const readJson = (p) => JSON.parse(fs.readFileSync(path.resolve("data", p), "utf8"));

const arabicDigits = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

// ---------- Tracked sunnahs ----------
const trackedBlock = dart.match(/kTrackedSunan = \[([\s\S]*?)\];/)[1];
const tracked = [...trackedBlock.matchAll(/TrackedSunnah\('([^']+)', '([^']+)'(?:, rakaat: (\d+))?\)/g)].map(
  ([, id, label, rakaat]) => ({ id, label, rakaat: Number(rakaat ?? 0) }),
);

// ---------- Content consts → JS ----------
// Dart named-arg constructors `SunnahItem(title: ..)` become `SunnahItem({title: ..})`;
// everything else (positional calls, list literals, single-quoted strings) is valid JS.
const start = dart.indexOf("const SunnahItem kRawatibVirtue");
let src = dart.slice(start);
let js = "";
const stack = [];
for (let i = 0; i < src.length; i++) {
  const c = src[i];
  if (c === "'") {
    let j = i + 1;
    while (src[j] !== "'") j += src[j] === "\\" ? 2 : 1;
    js += src.slice(i, j + 1);
    i = j;
  } else if (c === "/" && src[i + 1] === "/") {
    while (i < src.length && src[i] !== "\n") i++;
    js += "\n";
  } else if (c === "(") {
    const obj = /SunnahItem\s*$/.test(js);
    stack.push(obj);
    js += obj ? "({" : "(";
  } else if (c === ")") {
    js += stack.pop() ? "})" : ")";
  } else js += c;
}
js = js
  .replace(/const (?:List<\w+>|SunnahItem) (\w+) =/g, "out.$1 =")
  .replace(/\bconst\b/g, "");

const out = {};
new Function("out", "SunnahItem", "SunnahGroup", "AyahRange", js)(
  out,
  (o) => ({ kind: "item", ...o }),
  (title, items) => ({ title, items }),
  (surah, from, to = from) => ({ surah, from, to }),
);

// ---------- Resolve Quran text ----------
const surahs = readJson("quran/surahs.json");
const ayahCache = new Map();
const ayahs = (n) => {
  if (!ayahCache.has(n)) ayahCache.set(n, readJson(`quran/surah/${n}.json`));
  return ayahCache.get(n);
};

const resolve = ({ kind, title, text, ranges, source, note }) => {
  const item = { title };
  if (ranges?.length) {
    item.verses = ranges.flatMap((r) =>
      Array.from({ length: r.to - r.from + 1 }, (_, k) => {
        const n = r.from + k;
        return { n, text: ayahs(r.surah)[n - 1].text };
      }),
    );
    item.reference = ranges
      .map((r) => {
        const name = surahs[r.surah - 1].nameShortAr;
        const span = r.from === r.to ? arabicDigits(r.from) : `${arabicDigits(r.from)}-${arabicDigits(r.to)}`;
        return `سورة ${name} ${span}`;
      })
      .join("، ");
  } else {
    item.text = text;
    if (source) item.reference = source;
  }
  if (note) item.note = note;
  if (kind !== "item") throw new Error(`unexpected ${kind}`);
  return item;
};

const result = {
  tracked,
  tabs: {
    rawatib: [{ items: [{ ...resolve(out.kRawatibVirtue), featured: true }, ...out.kRawatib.map(resolve)] }],
    nawafil: [{ items: out.kNawafil.map(resolve) }],
    daily: out.kDailySunan.map((g) => ({ title: g.title, items: g.items.map(resolve) })),
    divine: [{ items: out.kDivineSunan.map(resolve) }],
  },
};

const file = path.resolve("data/sunan/sunan.json");
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify(result));
const count = Object.values(result.tabs).flat().reduce((s, g) => s + g.items.length, 0);
console.log(`sunan: ${tracked.length} tracked, ${count} items → ${path.relative(process.cwd(), file)}`);
