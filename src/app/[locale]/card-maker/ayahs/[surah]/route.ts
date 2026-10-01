import { routing } from "@/i18n/routing";
import { getSurahAyahs } from "@/lib/data";

// Uthmani text of one surah (string per ayah), fetched when the card's surah changes.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => Array.from({ length: 114 }, (_, i) => ({ locale, surah: String(i + 1) })));
}

export async function GET(_: Request, { params }: RouteContext<"/[locale]/card-maker/ayahs/[surah]">) {
  const n = Number((await params).surah);
  if (!(n >= 1 && n <= 114)) return new Response(null, { status: 404 });
  return Response.json((await getSurahAyahs(n)).map((a) => a.text));
}
