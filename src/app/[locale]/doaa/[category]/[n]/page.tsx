import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ZikrList } from "@/components/azkar/zikr-list";
import { PageHeader, toLocaleDigits } from "@/components/page-header";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getDoaaCategories } from "@/lib/data/doaa";

export const dynamicParams = false;

export async function generateStaticParams() {
  const categories = await getDoaaCategories();
  return routing.locales.flatMap((locale) =>
    categories.flatMap((c) => c.prayers.map((_, i) => ({ locale, category: c.id, n: String(i + 1) }))),
  );
}

export async function generateMetadata({ params }: PageProps<"/[locale]/doaa/[category]/[n]">) {
  const { category, n } = await params;
  return { title: (await getDoaaCategories()).find((c) => c.id === category)?.prayers[Number(n) - 1]?.title };
}

export default async function DoaaPrayerPage({ params }: PageProps<"/[locale]/doaa/[category]/[n]">) {
  const { locale, category: id, n } = await params;
  setRequestLocale(locale);
  const [t, categories] = await Promise.all([getTranslations("doaa"), getDoaaCategories()]);
  const category = categories.find((c) => c.id === id);
  const index = Number(n) - 1;
  const prayer = category?.prayers[index];
  if (!category || !prayer) notFound();
  const prev = index > 0 ? index : null;
  const next = index + 1 < category.prayers.length ? index + 2 : null;

  return (
    <>
      <Link href={`/doaa/${id}`} className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
        <ChevronRight className="size-4 ltr:rotate-180" /> {t(`categories.${id}`)}
      </Link>
      <PageHeader
        title={<span dir="rtl">{prayer.title}</span>}
        subtitle={t("items", { count: prayer.items.length, n: toLocaleDigits(prayer.items.length, locale) })}
      />
      <ZikrList items={prayer.items} />
      <nav className="mt-6 flex justify-between gap-3">
        {prev ? (
          <Link href={`/doaa/${id}/${prev}`} className="inline-flex items-center gap-1 rounded-xl border bg-card px-4 py-2 text-sm hover:border-brand/50">
            <ChevronRight className="size-4 ltr:rotate-180" /> {t("previous")}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/doaa/${id}/${next}`} className="inline-flex items-center gap-1 rounded-xl border bg-card px-4 py-2 text-sm hover:border-brand/50">
            {t("next")} <ChevronLeft className="size-4 ltr:rotate-180" />
          </Link>
        )}
      </nav>
    </>
  );
}
