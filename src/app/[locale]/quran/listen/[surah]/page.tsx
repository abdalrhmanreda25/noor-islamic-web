import { ChevronLeft, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import { ListenPlayer } from "@/components/quran-listen/listen-player";
import { routing } from "@/i18n/routing";
import { getSurahAyahs, getSurahs } from "@/lib/data";
import { getAyahReciters } from "@/lib/data/quran-listen";

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => Array.from({ length: 114 }, (_, i) => ({ locale, surah: String(i + 1) })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/quran/listen/[surah]">) {
  const { locale, surah } = await params;
  const [tf, surahs] = await Promise.all([getTranslations("features"), getSurahs()]);
  const s = surahs[Number(surah) - 1];
  return { title: `${tf("quran-listen.title")} · ${locale === "ar" ? `سورة ${s.nameShortAr}` : s.nameEn}` };
}

export default async function ListenSurahPage({ params }: PageProps<"/[locale]/quran/listen/[surah]">) {
  const { locale, surah: param } = await params;
  setRequestLocale(locale);
  const number = Number(param);
  if (!(number >= 1 && number <= 114)) notFound();
  const [t, tf, surahs, ayahs, reciters] = await Promise.all([
    getTranslations("quran-listen"),
    getTranslations("features"),
    getSurahs(),
    getSurahAyahs(number),
    getAyahReciters(),
  ]);
  const surah = surahs[number - 1];
  const Back = locale === "ar" ? ChevronRight : ChevronLeft;

  return (
    <>
      <Link href="/quran/listen" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <Back className="size-4" />
        {tf("quran-listen.title")} · {t("allSurahs")}
      </Link>
      <header className="hero-gradient mb-4 rounded-2xl p-6 text-center text-white">
        <h1 className="quran-text text-4xl text-gold" dir="rtl">سورة {surah.nameShortAr}</h1>
        {locale === "en" && <p className="mt-1 text-white/80">{surah.nameEn} · {surah.translationEn}</p>}
        <p className="mt-2 text-sm text-white/70">{t("ayahs", { count: toLocaleDigits(surah.ayahs, locale) })}</p>
      </header>
      <ListenPlayer surah={number} ayahs={ayahs.map(({ n, text }) => ({ n, text }))} reciters={reciters} />
    </>
  );
}
