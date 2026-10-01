// Mutashabihat from the Flutter assets:
//  data/mutashabihat/groups.json  curated groups; differing words wrapped in ⟦ ⟧
//  data/mutashabihat/index.json   { source, stats, ayat: { "S:A": [target, flags, own?][] } }
import fs from "node:fs";
import path from "node:path";

const SRC = "/Users/abdalrhmanreda/Codex/Flutter/noon-islamic-android/assets/data";
const OUT = path.join(process.cwd(), "data", "mutashabihat");
fs.mkdirSync(OUT, { recursive: true });

const groups = JSON.parse(fs.readFileSync(path.join(SRC, "mutashabihat.json"), "utf8"));
fs.writeFileSync(path.join(OUT, "groups.json"), JSON.stringify(groups));

const all = JSON.parse(fs.readFileSync(path.join(SRC, "mutashabihat_all.json"), "utf8"));
const { name, author, url, license } = all.source;
fs.writeFileSync(
  path.join(OUT, "index.json"),
  JSON.stringify({ source: { name, author, url, license }, stats: all.stats, ayat: all.ayat }),
);
console.log(`mutashabihat: ${groups.groups.length} groups, ${Object.keys(all.ayat).length} indexed ayat`);
