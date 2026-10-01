// Converts the Flutter duas (assets/data/prayers.json) into data/doaa/categories.json
// and copies the category icons into public/icons/doaa/.
// Category order and icons match PrayersCubit.prayers().
//
// Usage: node scripts/convert-doaa.mjs [path-to-flutter-repo]
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2] ?? "../../Flutter/noon-islamic-android");
const raw = JSON.parse(fs.readFileSync(path.join(SRC, "assets/data/prayers.json"), "utf8"));

// [slug, JSON key, icon source]
const CATEGORIES = [
  ["food", "أدعية للطعام", "assets/prayers/vegetable.svg"],
  ["prayer", "أدعية للصلاة", "assets/prayers/prayer.svg"],
  ["dead", "أدعية للميت", "assets/prayers/dead-body.svg"],
  ["travel", "أدعية للسفر", "assets/prayers/plane.svg"],
  ["misc", "أدعية متنوعة", "assets/icons/hand.svg"],
  ["arafah", "أدعية يوم عرفة", "assets/icons/kaaba.svg"],
];

fs.mkdirSync("public/icons/doaa", { recursive: true });
const out = CATEGORIES.map(([id, key, icon]) => {
  fs.copyFileSync(path.join(SRC, icon), `public/icons/doaa/${id}.svg`);
  return {
    id,
    title: key,
    icon: `/icons/doaa/${id}.svg`,
    prayers: raw[key].map((p) => ({
      title: p.TITLE.trim(),
      titleEn: p.eng_title?.trim() || undefined,
      items: p.TEXT.filter((t) => t.ARABIC_TEXT?.trim()).map((t) => ({
        content: (t.ARABIC_TEXT ?? "").trim(),
        count: t.REPEAT || 1,
        description: "",
        reference: "",
      })),
    })),
  };
});

fs.mkdirSync("data/doaa", { recursive: true });
fs.writeFileSync("data/doaa/categories.json", JSON.stringify(out));
console.log("wrote data/doaa/categories.json", out.map((c) => `${c.id}:${c.prayers.length}`).join(" "));
