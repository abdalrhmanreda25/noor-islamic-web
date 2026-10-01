// Static JSON of one surah's ayah text, fetched by the listening wird after it
// draws the day's passage on the client (the draw depends on the local date).
import { routing } from "@/i18n/routing";
import { getSurahAyahs } from "@/lib/data";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => Array.from({ length: 114 }, (_, i) => ({ locale, surah: String(i + 1) })));
}

export async function GET(_req: Request, ctx: RouteContext<"/[locale]/listening-wird/text/[surah]">) {
  const n = Number((await ctx.params).surah);
  if (!(n >= 1 && n <= 114)) return new Response(null, { status: 404 });
  const ayahs = await getSurahAyahs(n);
  return Response.json(ayahs.map(({ n, text }) => ({ n, text })));
}
