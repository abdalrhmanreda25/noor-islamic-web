import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { NamesGrid } from "@/components/names-grid";
import { getNamesOfAllah } from "@/lib/data";

export async function generateMetadata() {
  return { title: (await getTranslations("nav"))("names") };
}

export default async function NamesPage({ params }: PageProps<"/[locale]/names-of-allah">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, names] = await Promise.all([getTranslations("nav"), getNamesOfAllah()]);
  return (
    <>
      <PageHeader title={t("names")} />
      <NamesGrid names={names} />
    </>
  );
}
