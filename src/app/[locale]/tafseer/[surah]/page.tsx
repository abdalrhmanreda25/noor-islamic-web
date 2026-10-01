import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TafseerSurahView } from "@/components/tafseer/surah-view";
import { routing } from "@/i18n/routing";
import { getSurahs } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    Array.from({ length: 114 }, (_, i) => ({ locale, surah: String(i + 1) })),
  );
}

export async function generateMetadata({ params }: PageProps<"/[locale]/tafseer/[surah]">) {
  const { locale, surah } = await params;
  const s = (await getSurahs())[Number(surah) - 1];
  const t = await getTranslations({ locale, namespace: "features" });
  return { title: `${t("tafseer.title")} · ${locale === "ar" ? `سورة ${s.nameShortAr}` : s.nameEn}` };
}

/** Muyassar (the default book); a different saved book redirects client-side. */
export default async function TafseerSurahPage({ params }: PageProps<"/[locale]/tafseer/[surah]">) {
  const { locale, surah } = await params;
  setRequestLocale(locale);
  const n = Number(surah);
  if (!(n >= 1 && n <= 114)) notFound();
  return <TafseerSurahView locale={locale} surah={n} book="muyassar" isDefaultRoute />;
}
