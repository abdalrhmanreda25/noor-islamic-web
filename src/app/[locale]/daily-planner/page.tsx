import { getTranslations, setRequestLocale } from "next-intl/server";
import { DailyPlanner } from "@/components/daily-planner/daily-planner";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("daily-planner.title") };
}

export default async function DailyPlannerPage({ params }: PageProps<"/[locale]/daily-planner">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tf = await getTranslations("features");
  return (
    <>
      <PageHeader title={tf("daily-planner.title")} subtitle={tf("daily-planner.desc")} />
      <DailyPlanner />
    </>
  );
}
