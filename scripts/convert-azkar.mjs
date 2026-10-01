// Copies the Flutter azkar category icons (assets/azkar/*.svg) into
// public/icons/azkar/, named by their category id in data/azkar.json.
// (The azkar text itself is converted by scripts/convert-data.mjs.)
//
// Usage: node scripts/convert-azkar.mjs [path-to-flutter-repo]
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2] ?? "../../Flutter/noon-islamic-android");
const ICONS = { 1: "moring_azker", 2: "night_azker", 3: "pray", 5: "sleeping", 6: "wake_up" };

fs.mkdirSync("public/icons/azkar", { recursive: true });
for (const [id, name] of Object.entries(ICONS)) {
  fs.copyFileSync(path.join(SRC, `assets/azkar/${name}.svg`), `public/icons/azkar/${id}.svg`);
}
console.log("copied", Object.keys(ICONS).length, "azkar icons to public/icons/azkar");
