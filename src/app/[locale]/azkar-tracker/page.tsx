import { getTranslations, setRequestLocale } from "next-intl/server";
import { AzkarTracker } from "@/components/azkar-tracker/azkar-tracker";
import { TRACKED } from "@/components/azkar-tracker/storage";
import { PageHeader } from "@/components/page-header";
import { getAzkar } from "@/lib/data";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("azkar-tracker.title") };
}

export default async function AzkarTrackerPage({ params }: PageProps<"/[locale]/azkar-tracker">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, azkar] = await Promise.all([getTranslations("features"), getAzkar()]);
  const byId = new Map(azkar.map((c) => [c.id, c]));
  const titles = Object.fromEntries(TRACKED.map((c) => [c.id, byId.get(c.azkarId)?.title ?? c.id]));
  const counts = Object.fromEntries(TRACKED.map((c) => [c.id, byId.get(c.azkarId)?.items.length ?? 0]));
  return (
    <>
      <PageHeader title={t("azkar-tracker.title")} subtitle={t("azkar-tracker.desc")} />
      <AzkarTracker titles={titles} counts={counts} />
    </>
  );
}
