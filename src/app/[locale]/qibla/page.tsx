import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader, toLocaleDigits } from "@/components/page-header";
import { QiblaCompass } from "@/components/qibla-compass";
import { getSurahAyahs } from "@/lib/data";

export async function generateMetadata() {
  return { title: (await getTranslations("nav"))("qibla") };
}

export default async function QiblaPage({ params }: PageProps<"/[locale]/qibla">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tq, baqarah] = await Promise.all([getTranslations("nav"), getTranslations("qibla"), getSurahAyahs(2)]);
  const ayah = baqarah[143];
  return (
    <>
      <PageHeader title={t("qibla")} subtitle={tq("subtitle")} />
      <QiblaCompass />
      <section className="mt-6 rounded-2xl border bg-card p-5 sm:p-7">
        <p className="text-sm font-bold text-gold">{tq("ayahTitle")}</p>
        <p className="quran-text mt-3 text-xl sm:text-2xl" dir="rtl">
          {ayah.text} <span className="ayah-marker">﴿{toLocaleDigits(ayah.n, "ar")}﴾</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{tq("ayahRef")}</p>
      </section>
    </>
  );
}
