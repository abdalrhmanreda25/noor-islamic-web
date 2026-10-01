import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { ZikrList } from "@/components/azkar/zikr-list";
import { trackedIdFor } from "@/components/azkar-tracker/storage";
import { routing } from "@/i18n/routing";
import { getAzkar } from "@/lib/data";

export const dynamicParams = false;

export async function generateStaticParams() {
  const azkar = await getAzkar();
  return routing.locales.flatMap((locale) => azkar.map((c) => ({ locale, id: String(c.id) })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/azkar/[id]">) {
  const { id } = await params;
  return { title: (await getAzkar()).find((c) => c.id === Number(id))?.title };
}

export default async function ZikrCategoryPage({ params }: PageProps<"/[locale]/azkar/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const category = (await getAzkar()).find((c) => c.id === Number(id));
  if (!category) notFound();
  return (
    <>
      <PageHeader title={category.title} />
      <ZikrList items={category.items} trackerId={trackedIdFor(category.id)} />
    </>
  );
}
