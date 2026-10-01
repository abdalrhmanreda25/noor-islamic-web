import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { SunanTabs } from "@/components/sunan/sunan-tabs";
import { SunanTracker } from "@/components/sunan/sunan-tracker";
import { getSunan } from "@/lib/data/sunan";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("sunan.title") };
}

export default async function SunanPage({ params }: PageProps<"/[locale]/sunan">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tf, t, data] = await Promise.all([getTranslations("features"), getTranslations("sunan"), getSunan()]);
  return (
    <>
      <PageHeader title={tf("sunan.title")} subtitle={t("subtitle")} />
      <SunanTracker tracked={data.tracked} />
      <SunanTabs tabs={data.tabs} />
    </>
  );
}
