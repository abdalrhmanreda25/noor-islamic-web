import { routing } from "@/i18n/routing";
import { getDailyChunk, getDailyMeta } from "@/lib/data/daily-content";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const { chunk, ayahs, hadiths } = await getDailyMeta();
  return routing.locales.flatMap((locale) =>
    (["ayah", "hadith"] as const).flatMap((kind) =>
      Array.from({ length: Math.ceil((kind === "ayah" ? ayahs : hadiths) / chunk) }, (_, i) => ({
        locale,
        kind,
        chunk: String(i),
      }))
    )
  );
}

export async function GET(_req: Request, { params }: RouteContext<"/[locale]/daily-content/pool/[kind]/[chunk]">) {
  const { kind, chunk } = await params;
  if ((kind !== "ayah" && kind !== "hadith") || !/^\d+$/.test(chunk)) return new Response("Not found", { status: 404 });
  const list = await getDailyChunk(kind, Number(chunk)).catch(() => null);
  return list ? Response.json(list) : new Response("Not found", { status: 404 });
}
