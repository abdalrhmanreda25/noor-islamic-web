import { routing } from "@/i18n/routing";
import { getWahidi } from "@/lib/data/asbab-nuzul";

// Static JSON of al-Wahidi's narrations, fetched lazily by the search box.
export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function GET() {
  return Response.json((await getWahidi()).entries);
}
