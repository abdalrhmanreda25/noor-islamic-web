import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TAFSIR_BOOKS, isTafsirBook } from "@/components/tafseer/books";
import { TafseerSurahView } from "@/components/tafseer/surah-view";
import { routing } from "@/i18n/routing";
import { getSurahs } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    TAFSIR_BOOKS.flatMap((book) => Array.from({ length: 114 }, (_, i) => ({ locale, surah: String(i + 1), book }))),
  );
}

export async function generateMetadata({ params }: PageProps<"/[locale]/tafseer/[surah]/[book]">) {
  const { locale, surah, book } = await params;
  const s = (await getSurahs())[Number(surah) - 1];
  const t = await getTranslations({ locale, namespace: "tafseer" });
  return { title: `${isTafsirBook(book) ? t(`books.${book}.title`) : ""} · ${locale === "ar" ? `سورة ${s.nameShortAr}` : s.nameEn}` };
}

export default async function TafseerBookPage({ params }: PageProps<"/[locale]/tafseer/[surah]/[book]">) {
  const { locale, surah, book } = await params;
  setRequestLocale(locale);
  const n = Number(surah);
  if (!(n >= 1 && n <= 114) || !isTafsirBook(book)) notFound();
  return <TafseerSurahView locale={locale} surah={n} book={book} />;
}
