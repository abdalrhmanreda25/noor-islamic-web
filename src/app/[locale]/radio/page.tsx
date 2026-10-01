import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { RadioBrowser } from "@/components/radio/radio-browser";
import { getRadioStations } from "@/lib/data/radio";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("radio.title") };
}

export default async function RadioPage({ params }: PageProps<"/[locale]/radio">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tf, t, stations] = await Promise.all([getTranslations("features"), getTranslations("radio"), getRadioStations()]);
  return (
    <>
      <PageHeader title={tf("radio.title")} subtitle={t("subtitle")} />
      <RadioBrowser stations={stations} />
    </>
  );
}
