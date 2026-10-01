// Converts the Flutter Seerah book (assets/data/seerah.json) into:
//   data/seerah/index.json         parts → chapters → lesson titles (no text)
//   data/seerah/chapters/<id>.json  the lessons of one chapter with their blocks
//   data/seerah/search.json         [lessonId, title, plain text] for client search
// Reading time matches SeerahLesson.minutes (~180 words a minute, 1–99).
//
// Usage: node scripts/convert-seerah.mjs [path-to-flutter-repo]
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2] ?? "../../Flutter/noon-islamic-android");
const book = JSON.parse(fs.readFileSync(path.join(SRC, "assets/data/seerah.json"), "utf8"));
const OUT = "data/seerah";
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(`${OUT}/chapters`, { recursive: true });

const words = (s = "") => (s.trim() ? s.trim().split(/\s+/).length : 0);
const TYPES = new Set(["p", "h", "s", "b", "a", "l"]);
const write = (file, data) => fs.writeFileSync(path.join(OUT, file), JSON.stringify(data));

const search = [];
const index = book.parts.map((part) => ({
  id: part.id,
  title: part.title,
  subtitle: part.subtitle,
  period: part.period,
  chapters: part.chapters.map((ch) => {
    const lessons = ch.lessons.map((l, i) => {
      const blocks = l.blocks
        .map((b) => ({ t: TYPES.has(b.t) ? b.t : "p", x: (b.x ?? "").trim(), ...(b.k ? { k: b.k.trim() } : {}) }))
        .filter((b) => b.x || b.k);
      const count = blocks.reduce((n, b) => n + words(b.x) + words(b.k), 0);
      const minutes = Math.min(99, Math.max(1, Math.ceil(count / 180)));
      search.push([l.id, l.title, blocks.map((b) => (b.k ? `${b.k}: ${b.x}` : b.x)).join("\n")]);
      return { id: l.id, slug: String(i + 1), title: l.title.trim(), minutes, blocks };
    });
    write(`chapters/${ch.id}.json`, lessons);
    return {
      id: ch.id,
      title: ch.title,
      period: ch.period,
      minutes: lessons.reduce((n, l) => n + l.minutes, 0),
      lessons: lessons.map(({ id, slug, title, minutes }) => ({ id, slug, title, minutes })),
    };
  }),
}));
write("index.json", index);
write("search.json", search);

const chapters = index.flatMap((p) => p.chapters);
console.log(`seerah: ${index.length} parts, ${chapters.length} chapters, ${search.length} lessons → ${OUT}/`);
