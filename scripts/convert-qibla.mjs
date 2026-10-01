// Copies the Kaaba icon used by the qibla compass (assets/icons/kaaba.svg)
// into public/icons/kaaba.svg.
//
// Usage: node scripts/convert-qibla.mjs [path-to-flutter-repo]
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2] ?? "../../Flutter/noon-islamic-android");
fs.mkdirSync("public/icons", { recursive: true });
fs.copyFileSync(path.join(SRC, "assets/icons/kaaba.svg"), "public/icons/kaaba.svg");
console.log("copied public/icons/kaaba.svg");
