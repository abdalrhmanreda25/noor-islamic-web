import { getTranslations, setRequestLocale } from "next-intl/server";
import { HijriTools } from "@/components/hijri/hijri-tools";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("hijri.title") };
}

export default async function HijriPage({ params }: PageProps<"/[locale]/hijri">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tf = await getTranslations("features");
  return (
    <>
      <PageHeader title={tf("hijri.title")} subtitle={tf("hijri.desc")} />
      <HijriTools />
    </>
  );
}
