import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { TasbeehCounter } from "@/components/tasbeeh-counter";
import { getTasbeeh } from "@/lib/data";

export async function generateMetadata() {
  return { title: (await getTranslations("nav"))("tasbeeh") };
}

export default async function TasbeehPage({ params }: PageProps<"/[locale]/tasbeeh">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tt, items] = await Promise.all([getTranslations("nav"), getTranslations("tasbeeh"), getTasbeeh()]);
  return (
    <>
      <PageHeader title={t("tasbeeh")} subtitle={tt("subtitle")} />
      <TasbeehCounter items={items} />
    </>
  );
}
