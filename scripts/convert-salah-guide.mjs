// Copies the Flutter salah guide (assets/data/salah_guide.json) into
// data/salah-guide/guide.json, dropping the emoji icons (the UI maps ids to icons).
//
// Usage: node scripts/convert-salah-guide.mjs [path-to-flutter-repo]
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2] ?? "../../Flutter/noon-islamic-android");
const raw = JSON.parse(fs.readFileSync(path.join(SRC, "assets/data/salah_guide.json"), "utf8"));

const guide = {
  title: raw.title,
  subtitle: raw.subtitle,
  categories: raw.categories.map(({ id, title, subtitle, topics }) => ({
    id,
    title,
    subtitle,
    topics: topics.map(({ id, question, intro, steps, blocks }) => ({
      id,
      question,
      intro: intro ?? "",
      steps: steps === true,
      blocks: blocks.map(({ type, text, reference }) => ({
        type: ["heading", "text", "verse", "hadith", "list"].includes(type) ? type : "text",
        text: text ?? "",
        ...(reference ? { reference } : {}),
      })),
    })),
  })),
};

fs.mkdirSync("data/salah-guide", { recursive: true });
fs.writeFileSync("data/salah-guide/guide.json", JSON.stringify(guide));
console.log("wrote data/salah-guide/guide.json", guide.categories.map((c) => `${c.id}:${c.topics.length}`).join(" "));
