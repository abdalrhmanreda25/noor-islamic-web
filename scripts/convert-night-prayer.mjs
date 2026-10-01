// Converts the Flutter night-prayer content (Dart consts in
// lib/features/night_prayer/data/qiyam_content.dart) into
// data/night-prayer/content.json, resolving Quran passages from data/quran.
// (assets/data/night.json is bundled but unused by the app's screen.)
//
// Usage: node scripts/convert-night-prayer.mjs [path-to-flutter-repo]
import fs from "node:fs";
import path from "node:path";
import { SRC, dartList, withQuran, writeJson } from "./convert-ruqyah.mjs";

const src = fs.readFileSync(path.join(SRC, "lib/features/night_prayer/data/qiyam_content.dart"), "utf8");

writeJson("data/night-prayer/content.json", {
  virtues: dartList(src, "kQiyamVirtues").map(withQuran),
  howTo: dartList(src, "kQiyamHowTo").map(withQuran),
  duas: dartList(src, "kQiyamDuas").map(withQuran),
  helps: dartList(src, "kQiyamHelps"),
});
