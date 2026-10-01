import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { SettingsView } from "@/components/settings/settings-view";
import { getReciters } from "@/lib/data";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("settings.title") };
}

export default async function SettingsPage({ params }: PageProps<"/[locale]/settings">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tf, reciters] = await Promise.all([getTranslations("features"), getReciters()]);
  return (
    <>
      <PageHeader title={tf("settings.title")} subtitle={tf("settings.desc")} />
      <SettingsView reciters={reciters} />
    </>
  );
}
