import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { PrayerTimesView } from "@/components/prayer/prayer-times-view";

export async function generateMetadata() {
  return { title: (await getTranslations("nav"))("prayer") };
}

export default async function PrayerTimesPage({ params }: PageProps<"/[locale]/prayer-times">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  return (
    <>
      <PageHeader title={t("prayer")} />
      <PrayerTimesView />
    </>
  );
}
