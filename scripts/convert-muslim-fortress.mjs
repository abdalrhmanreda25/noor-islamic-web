// Converts Hisn al-Muslim (assets/data/hisn_almuslim.json) into
// data/muslim-fortress/chapters.json, applying the app's cleanHisnText and
// hisnRepeatCount (islamic_text_model.dart).
//
// Usage: node scripts/convert-muslim-fortress.mjs [path-to-flutter-repo]
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2] ?? "../../Flutter/noon-islamic-android");
const raw = JSON.parse(fs.readFileSync(path.join(SRC, "assets/data/hisn_almuslim.json"), "utf8"));

const clean = (s) =>
  s
    .replaceAll("*", " ")
    .replaceAll("{", "﴿")
    .replaceAll("}", "﴾")
    .replace(/[ \t]+/g, " ")
    .replace(/ ([،,.:؛])/g, "$1")
    .trim();

const COUNTS = {
  "ثلاث مرات": 3,
  "ثلاثاً": 3,
  "ثلاثا": 3,
  "أربع مرات": 4,
  "سبع مرات": 7,
  "عشر مرات": 10,
  "مائة مرة": 100,
};
const COUNT_RE = new RegExp(`\\(\\s*(${Object.keys(COUNTS).join("|")})(?!\\S*\\s*وثلاثين)`);
const repeat = (s) => COUNTS[COUNT_RE.exec(s)?.[1]] ?? 1;

const chapters = Object.entries(raw).map(([title, v], i) => ({
  n: i + 1,
  title,
  items: (v.text ?? []).map((t) => {
    const content = clean(t);
    return { content, count: repeat(content), description: "", reference: "" };
  }),
  footnotes: (v.footnote ?? []).map((f) => f.trim()).filter(Boolean),
}));

fs.mkdirSync("data/muslim-fortress", { recursive: true });
fs.writeFileSync("data/muslim-fortress/chapters.json", JSON.stringify(chapters));
console.log("wrote data/muslim-fortress/chapters.json", chapters.length);
