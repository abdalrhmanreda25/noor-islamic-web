import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/page-header";
import { FiqhCategoryTopics } from "@/components/fiqh/category-topics";
import { FiqhIcon } from "@/components/fiqh/icons";
import { FiqhSalahGuideLink } from "@/components/fiqh/salah-guide-link";
import { getFiqhIndex } from "@/lib/data/fiqh";

export const dynamicParams = false;

export async function generateStaticParams() {
  const { categories } = await getFiqhIndex();
  return routing.locales.flatMap((locale) => categories.map((c) => ({ locale, category: c.id })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/fiqh/[category]">) {
  const { category } = await params;
  return { title: (await getFiqhIndex()).categories.find((c) => c.id === category)?.title };
}

export default async function FiqhCategoryPage({ params }: PageProps<"/[locale]/fiqh/[category]">) {
  const { locale, category: id } = await params;
  setRequestLocale(locale);
  const [t, { categories }] = await Promise.all([getTranslations("features"), getFiqhIndex()]);
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/fiqh" className="text-sm text-brand hover:underline">
        {locale === "ar" ? "→" : "←"} {t("fiqh.title")}
      </Link>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/15 text-brand">
              <FiqhIcon id={category.id} className="size-6" />
            </span>
            <bdi>{category.title}</bdi>
          </span>
        }
        subtitle={<bdi>{category.subtitle}</bdi>}
      />
      <FiqhCategoryTopics category={category} />
      {(id === "islam-pillars" || id === "aqeedah") && <FiqhSalahGuideLink />}
    </div>
  );
}
