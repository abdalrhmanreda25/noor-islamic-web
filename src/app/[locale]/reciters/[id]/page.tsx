import { ChevronLeft, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import { ReciterAvatar } from "@/components/reciters/reciter-avatar";
import { ReciterSurahs } from "@/components/reciters/reciter-surahs";
import { routing } from "@/i18n/routing";
import { getSurahs } from "@/lib/data";
import { getAllReciters } from "@/lib/data/reciters";

export const dynamicParams = false;

export async function generateStaticParams() {
  const reciters = await getAllReciters();
  return routing.locales.flatMap((locale) => reciters.map((r) => ({ locale, id: String(r.id) })));
}

const find = async (id: string) => (await getAllReciters()).find((r) => String(r.id) === id);

export async function generateMetadata({ params }: PageProps<"/[locale]/reciters/[id]">) {
  const { locale, id } = await params;
  const r = await find(id);
  return { title: r && (locale === "ar" ? r.name : r.nameEn) };
}

export default async function ReciterPage({ params }: PageProps<"/[locale]/reciters/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const reciter = await find(id);
  if (!reciter) notFound();
  const [t, surahs] = await Promise.all([getTranslations("reciters"), getSurahs()]);
  const Back = locale === "ar" ? ChevronRight : ChevronLeft;
  const total = Math.max(...reciter.moshaf.map((m) => m.total));

  return (
    <>
      <Link href="/reciters" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <Back className="size-4" />
        {t("back")}
      </Link>
      <header className="hero-gradient mb-6 flex items-center gap-4 rounded-2xl p-5 text-white shadow-xl shadow-primary/20 sm:p-7">
        <ReciterAvatar name={locale === "ar" ? reciter.name : reciter.nameEn} className="size-16 text-xl sm:size-20 sm:text-2xl" />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold sm:text-3xl">{locale === "ar" ? reciter.name : reciter.nameEn}</h1>
          {locale === "en" && <p className="mt-0.5 text-white/70" dir="rtl">{reciter.name}</p>}
          <p className="mt-2 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-white/10 px-3 py-1">{t("surahCount", { n: toLocaleDigits(total, locale) })}</span>
            {reciter.moshaf.length > 1 && (
              <span className="rounded-full bg-gold/20 px-3 py-1 text-gold">
                {t("moshafCount", { n: toLocaleDigits(reciter.moshaf.length, locale) })}
              </span>
            )}
            {reciter.moshaf.length === 1 && (
              <span className="rounded-full bg-gold/20 px-3 py-1 text-gold">
                {locale === "ar" ? reciter.moshaf[0].name : reciter.moshaf[0].nameEn}
              </span>
            )}
          </p>
        </div>
      </header>
      <ReciterSurahs
        reciter={reciter}
        surahs={surahs.map(({ number, nameShortAr, nameEn, ayahs }) => ({ number, nameShortAr, nameEn, ayahs }))}
      />
    </>
  );
}
