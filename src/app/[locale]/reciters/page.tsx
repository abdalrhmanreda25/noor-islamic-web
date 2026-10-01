import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { ReciterList } from "@/components/reciters/reciter-list";
import { getAllReciters } from "@/lib/data/reciters";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("reciters.title") };
}

export default async function RecitersPage({ params }: PageProps<"/[locale]/reciters">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, reciters] = await Promise.all([getTranslations("features"), getAllReciters()]);
  return (
    <>
      <PageHeader title={t("reciters.title")} subtitle={t("reciters.desc")} />
      <ReciterList reciters={reciters} />
    </>
  );
}
