// Converts the Flutter ruqyah content (Dart const lists in
// lib/features/rookia/data/ruqyah_data.dart) into data/ruqyah/content.json.
// Quran passages are stored as references in the app; their text is resolved
// here from data/quran (run scripts/convert-data.mjs first).
//
// Usage: node scripts/convert-ruqyah.mjs [path-to-flutter-repo]
// Also exports the Dart-const parser used by convert-night-prayer.mjs.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const SRC = path.resolve(process.argv[2] ?? "../../Flutter/noon-islamic-android");

/**
 * Evaluates `const List<T> name = [ ... ];` from a Dart file as JS.
 * `AyahRange(s, a[, b])` → `{surah, from, to}`, `Item(name: v)` → `{name: v}`,
 * `Enum.value` → `"value"`, set literals `{a, b}` → arrays, adjacent string
 * literals are concatenated.
 */
export function dartList(source, name) {
  const start = source.indexOf(` ${name} = [`);
  if (start < 0) throw new Error(`${name} not found`);
  let i = source.indexOf("[", start);
  let out = "";
  const stack = [];
  let lastWasString = false;
  while (i < source.length) {
    const c = source[i];
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (source[j] !== c) j += source[j] === "\\" ? 2 : 1;
      if (lastWasString) out += "+";
      out += JSON.stringify(source.slice(i + 1, j).replace(/\\(.)/g, "$1"));
      lastWasString = true;
      i = j + 1;
      continue;
    }
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    lastWasString = false;
    const ident = /^[A-Za-z_]\w*/.exec(source.slice(i))?.[0];
    if (ident) {
      const after = source.slice(i + ident.length);
      if (after.startsWith("(")) {
        if (ident === "AyahRange") {
          const m = /^\(\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+)\s*)?\)/.exec(after);
          out += JSON.stringify({ surah: +m[1], from: +m[2], to: +(m[3] ?? m[2]) });
          i += ident.length + m[0].length;
          continue;
        }
        out += "{";
        stack.push("}");
        i += ident.length + 1;
        continue;
      }
      const enumVal = /^\.(\w+)/.exec(after);
      if (/^[A-Z]/.test(ident) && enumVal) {
        out += JSON.stringify(enumVal[1]);
        i += ident.length + enumVal[0].length;
        continue;
      }
      out += ident;
      i += ident.length;
      continue;
    }
    if (c === "[" || c === "{") {
      out += "[";
      stack.push("]");
    } else if (c === "(") {
      out += "(";
      stack.push(")");
    } else if (c === "]" || c === "}" || c === ")") {
      out += stack.pop();
      if (!stack.length) break;
    } else out += c;
    i++;
  }
  return new Function(`return ${out}`)();
}

const surahs = JSON.parse(fs.readFileSync("data/quran/surahs.json", "utf8"));
const surahCache = new Map();
const ayahText = (s, a) => {
  if (!surahCache.has(s))
    surahCache.set(s, JSON.parse(fs.readFileSync(`data/quran/surah/${s}.json`, "utf8")));
  return surahCache.get(s)[a - 1].text;
};

const arDigits = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

/** Resolves `ranges` into verses + Arabic/English references. */
export function withQuran(item) {
  if (!item.ranges?.length) return item;
  const { ranges, ...rest } = item;
  const span = (r, digits) => (r.from === r.to ? digits(r.from) : `${digits(r.from)}-${digits(r.to)}`);
  return {
    ...rest,
    verses: ranges.flatMap((r) =>
      Array.from({ length: r.to - r.from + 1 }, (_, k) => ({
        surah: r.surah,
        ayah: r.from + k,
        text: ayahText(r.surah, r.from + k),
      })),
    ),
    refAr: ranges.map((r) => `${surahs[r.surah - 1].nameShortAr} ${span(r, arDigits)}`).join("، "),
    refEn: ranges.map((r) => `${surahs[r.surah - 1].nameEn} ${span(r, String)}`).join(", "),
  };
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value));
  console.log("wrote", file);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const src = fs.readFileSync(path.join(SRC, "lib/features/rookia/data/ruqyah_data.dart"), "utf8");
  writeJson("data/ruqyah/content.json", {
    guide: dartList(src, "kRuqyahGuide"),
    quran: dartList(src, "kRuqyahQuran").map(withQuran),
    duas: dartList(src, "kRuqyahDuas"),
  });
}
