import { getTranslations, setRequestLocale } from "next-intl/server";
import { AchievementsView } from "@/components/achievements/achievements-view";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("achievements.title") };
}

export default async function AchievementsPage({ params }: PageProps<"/[locale]/achievements">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tf = await getTranslations("features");
  return (
    <>
      <PageHeader title={tf("achievements.title")} subtitle={tf("achievements.desc")} />
      <AchievementsView />
    </>
  );
}
