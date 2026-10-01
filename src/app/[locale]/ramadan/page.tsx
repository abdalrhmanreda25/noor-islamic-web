import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { RamadanView } from "@/components/ramadan/ramadan-view";
import { getSurahAyahs } from "@/lib/data";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("ramadan.title") };
}

export default async function RamadanPage({ params }: PageProps<"/[locale]/ramadan">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tf, qadr] = await Promise.all([getTranslations("features"), getSurahAyahs(97)]);
  return (
    <>
      <PageHeader title={tf("ramadan.title")} subtitle={tf("ramadan.desc")} />
      <RamadanView qadrAyah={qadr[2].text} />
    </>
  );
}
