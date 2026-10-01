import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { FiqhBrowser } from "@/components/fiqh/fiqh-browser";
import { getFiqhIndex, getFiqhSearchIndex } from "@/lib/data/fiqh";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("fiqh.title") };
}

export default async function FiqhPage({ params }: PageProps<"/[locale]/fiqh">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, data, searchIndex] = await Promise.all([getTranslations("features"), getFiqhIndex(), getFiqhSearchIndex()]);
  return (
    <>
      <PageHeader title={t("fiqh.title")} subtitle={t("fiqh.desc")} />
      <FiqhBrowser data={data} searchIndex={searchIndex} />
    </>
  );
}
