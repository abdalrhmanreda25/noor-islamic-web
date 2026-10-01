// Asbab al-nuzul from the Flutter assets:
//  data/asbab-nuzul/topics.json      curated articles (categories -> topics -> blocks)
//  data/asbab-nuzul/wahidi.json      { source, entries: [surah, from, to, text][] }
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const SRC = "/Users/abdalrhmanreda/Codex/Flutter/noon-islamic-android/assets/data";
const OUT = path.join(process.cwd(), "data", "asbab-nuzul");
fs.mkdirSync(OUT, { recursive: true });

const topics = JSON.parse(fs.readFileSync(path.join(SRC, "asbab_nuzul.json"), "utf8"));
fs.writeFileSync(path.join(OUT, "topics.json"), JSON.stringify(topics));

const wahidi = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(SRC, "asbab_wahidi.json.gz"))).toString("utf8"));
const entries = wahidi.entries
  .map(([surah, from, to, text]) => [surah, from, to, text.replace(/\r/g, "").replace(/\n{2,}/g, "\n").trim()])
  .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
fs.writeFileSync(path.join(OUT, "wahidi.json"), JSON.stringify({ source: wahidi.source, entries }));

const topicCount = topics.categories.reduce((n, c) => n + c.topics.length, 0);
console.log(`asbab-nuzul: ${topicCount} topics, ${entries.length} wahidi entries`);
