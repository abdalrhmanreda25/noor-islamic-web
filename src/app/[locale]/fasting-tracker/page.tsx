import { getTranslations, setRequestLocale } from "next-intl/server";
import { FastingTracker } from "@/components/fasting-tracker/fasting-tracker";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("fasting-tracker.title") };
}

export default async function FastingTrackerPage({ params }: PageProps<"/[locale]/fasting-tracker">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tf = await getTranslations("features");
  return (
    <>
      <PageHeader title={tf("fasting-tracker.title")} subtitle={tf("fasting-tracker.desc")} />
      <FastingTracker />
    </>
  );
}
