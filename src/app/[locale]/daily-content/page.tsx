import { getTranslations, setRequestLocale } from "next-intl/server";
import { DailyContent } from "@/components/daily-content/daily-content";
import { getSurahs } from "@/lib/data";
import { getDailyEntries, getDailyMeta } from "@/lib/data/daily-content";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("daily-content.title") };
}

export default async function DailyContentPage({ params }: PageProps<"/[locale]/daily-content">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [meta, entries, surahs] = await Promise.all([getDailyMeta(), getDailyEntries(), getSurahs()]);
  return (
    <DailyContent
      meta={meta}
      entries={entries}
      surahNames={surahs.map((s) => ({ ar: s.nameShortAr, en: s.nameEn }))}
    />
  );
}
