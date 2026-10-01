import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { PrayerTracker } from "@/components/prayer-tracker/prayer-tracker";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("prayer-tracker.title") };
}

export default async function PrayerTrackerPage({ params }: PageProps<"/[locale]/prayer-tracker">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("features");
  return (
    <>
      <PageHeader title={t("prayer-tracker.title")} subtitle={t("prayer-tracker.desc")} />
      <PrayerTracker />
    </>
  );
}
