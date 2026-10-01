import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PrayerHero } from "@/components/prayer-hero";
import { toLocaleDigits } from "@/components/page-header";
import { featuresBySection } from "@/config/features";
import { getAyahOfDay } from "@/lib/data";

// Re-render daily so "ayah of the day" changes.
export const revalidate = 86400;

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tf, ts, { surah, ayah }] = await Promise.all([
    getTranslations("home"),
    getTranslations("features"),
    getTranslations("sections"),
    getAyahOfDay(),
  ]);

  return (
    <div className="space-y-8">
      <PrayerHero />

      <Link
        href={`/quran/page/${ayah.page}`}
        className="block rounded-2xl border bg-card p-5 transition hover:border-brand/50"
      >
        <p className="text-sm font-medium text-brand">{t("ayahOfDay")}</p>
        <p dir="rtl" className="quran-text mt-3 text-center text-2xl sm:text-3xl">
          {ayah.text} <span className="ayah-marker">﴿{toLocaleDigits(ayah.n, "ar")}﴾</span>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {locale === "ar" ? `سورة ${surah.nameShortAr}` : `${surah.nameEn} ${surah.number}:${ayah.n}`}
        </p>
      </Link>

      {featuresBySection().map(({ section, features }) => (
        <section key={section}>
          <h2 className="mb-3 text-lg font-bold">{ts(section)}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {features.map(({ id, href, icon: Icon }) => (
              <Link
                key={id}
                href={href}
                className="group rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-md"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-secondary text-brand transition group-hover:bg-primary group-hover:text-gold">
                  <Icon className="size-5" />
                </span>
                <p className="mt-3 font-bold">{tf(`${id}.title`)}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{tf(`${id}.desc`)}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
