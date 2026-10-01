import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { NightContent } from "@/components/night-prayer/night-content";
import { QiyamTracker } from "@/components/night-prayer/qiyam-tracker";
import { TonightCard } from "@/components/night-prayer/tonight-card";
import { getNightPrayerContent } from "@/lib/data/night-prayer";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("night-prayer.title") };
}

export default async function NightPrayerPage({ params }: PageProps<"/[locale]/night-prayer">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, content] = await Promise.all([getTranslations("features"), getNightPrayerContent()]);
  return (
    <>
      <PageHeader title={t("night-prayer.title")} subtitle={t("night-prayer.desc")} />
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <TonightCard />
          <QiyamTracker />
        </div>
        <NightContent content={content} />
      </div>
    </>
  );
}
