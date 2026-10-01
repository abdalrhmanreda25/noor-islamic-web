import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { SalahGuideList } from "@/components/salah-guide/salah-guide-list";
import { getSalahGuide } from "@/lib/data/salah-guide";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("salah-guide.title") };
}

export default async function SalahGuidePage({ params }: PageProps<"/[locale]/salah-guide">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, guide] = await Promise.all([getTranslations("features"), getSalahGuide()]);
  return (
    <>
      <PageHeader title={t("salah-guide.title")} subtitle={t("salah-guide.desc")} />
      <SalahGuideList guide={guide} />
    </>
  );
}
