import { routing } from "@/i18n/routing";
import { getSurahAyahs } from "@/lib/data";

// Plain (no tashkeel) text of every ayah as [surah, ayah, text], for the ayah search.
export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const plain = (s: string) =>
  s
    .replace(/[ؐ-ًؚ-ٟۖ-ۭـ]/g, "")
    .replace(/ٰ/g, "ا")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/\s+/g, " ")
    .trim();

export async function GET() {
  const rows: [number, number, string][] = [];
  for (let s = 1; s <= 114; s++) for (const a of await getSurahAyahs(s)) rows.push([s, a.n, plain(a.text)]);
  return Response.json(rows);
}
