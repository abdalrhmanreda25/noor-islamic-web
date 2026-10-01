import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { PageHeader, toLocaleDigits } from "@/components/page-header";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getDoaaCategories } from "@/lib/data/doaa";

export const dynamicParams = false;

export async function generateStaticParams() {
  const categories = await getDoaaCategories();
  return routing.locales.flatMap((locale) => categories.map((c) => ({ locale, category: c.id })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/doaa/[category]">) {
  const { category } = await params;
  return { title: (await getTranslations("doaa"))(`categories.${category}`) };
}

export default async function DoaaCategoryPage({ params }: PageProps<"/[locale]/doaa/[category]">) {
  const { locale, category: id } = await params;
  setRequestLocale(locale);
  const [t, categories] = await Promise.all([getTranslations("doaa"), getDoaaCategories()]);
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();
  return (
    <>
      <PageHeader
        title={t(`categories.${id}`)}
        subtitle={t("count", { count: category.prayers.length, n: toLocaleDigits(category.prayers.length, locale) })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {category.prayers.map((p, i) => (
          <Link
            key={i}
            href={`/doaa/${id}/${i + 1}`}
            className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:border-brand/50 hover:shadow-sm"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 font-bold text-brand">
              {toLocaleDigits(i + 1, locale)}
            </span>
            <span className="min-w-0 flex-1" dir="rtl">
              <span className="block font-bold">{p.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {t("items", { count: p.items.length, n: toLocaleDigits(p.items.length, locale) })}
              </span>
            </span>
            <ChevronLeft className="size-5 text-muted-foreground ltr:rotate-180" />
          </Link>
        ))}
      </div>
    </>
  );
}
