/* eslint-disable @next/next/no-img-element */
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader, toLocaleDigits } from "@/components/page-header";
import { Link } from "@/i18n/navigation";
import { getDoaaCategories } from "@/lib/data/doaa";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("doaa.title") };
}

export default async function DoaaPage({ params }: PageProps<"/[locale]/doaa">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tf, t, categories] = await Promise.all([getTranslations("features"), getTranslations("doaa"), getDoaaCategories()]);
  return (
    <>
      <PageHeader title={tf("doaa.title")} subtitle={tf("doaa.desc")} />
      <section className="hero-gradient mb-6 rounded-2xl p-5 text-white sm:p-7">
        <p className="text-sm text-gold">{t("heroLabel")}</p>
        <p className="mt-2 text-xl leading-loose font-bold sm:text-2xl" dir="rtl">
          <span className="quran-text">﴿وَقَالَ رَبُّكُمُ ٱدۡعُونِيٓ أَسۡتَجِبۡ لَكُمۡ﴾</span>
        </p>
        <p className="mt-1 text-sm text-white/70">{t("heroRef")}</p>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/doaa/${c.id}`}
            className="flex items-center gap-4 rounded-2xl border bg-card p-5 transition hover:border-brand/50 hover:shadow-sm"
          >
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-secondary p-2.5">
              <img src={c.icon} alt="" width={44} height={44} className="size-11 object-contain" />
            </span>
            <span>
              <span className="block text-lg font-bold">{t(`categories.${c.id}`)}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {t("count", { count: c.prayers.length, n: toLocaleDigits(c.prayers.length, locale) })}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
