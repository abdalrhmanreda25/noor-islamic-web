// Converts the Flutter app's "تفقه في الدين" content (assets/data/fiqh.json)
// into data/fiqh/: index.json (categories + topic titles) and one file per
// category with its full topics. Blocks become compact { t, x, r? } objects.
import fs from "node:fs";
import path from "node:path";

const SRC = "/Users/abdalrhmanreda/Codex/Flutter/noon-islamic-android/assets/data/fiqh.json";
const OUT = path.join(process.cwd(), "data/fiqh");
const TYPES = new Set(["heading", "text", "verse", "hadith", "list"]);

const src = JSON.parse(fs.readFileSync(SRC, "utf8"));
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const index = { title: src.title, subtitle: src.subtitle, categories: [] };
let topics = 0;
for (const c of src.categories) {
  const full = c.topics.map((t) => ({
    id: t.id,
    question: t.question,
    intro: t.intro ?? "",
    ...(t.steps ? { steps: true } : {}),
    blocks: (t.blocks ?? []).map((b) => ({
      t: TYPES.has(b.type) ? b.type : "text",
      x: (b.text ?? "").trim(),
      ...(b.reference ? { r: b.reference } : {}),
    })),
  }));
  topics += full.length;
  fs.writeFileSync(path.join(OUT, `${c.id}.json`), JSON.stringify(full));
  index.categories.push({
    id: c.id,
    title: c.title,
    subtitle: c.subtitle ?? "",
    topics: full.map((t) => ({ id: t.id, question: t.question, ...(t.steps ? { steps: true } : {}) })),
  });
}
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index));
console.log(`fiqh: ${index.categories.length} categories, ${topics} topics -> data/fiqh/`);
