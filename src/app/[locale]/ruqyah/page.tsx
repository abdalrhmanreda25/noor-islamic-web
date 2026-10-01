import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { RuqyahView } from "@/components/ruqyah/ruqyah-view";
import { getRuqyahContent } from "@/lib/data/ruqyah";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("ruqyah.title") };
}

export default async function RuqyahPage({ params }: PageProps<"/[locale]/ruqyah">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, content] = await Promise.all([getTranslations("features"), getRuqyahContent()]);
  return (
    <>
      <PageHeader title={t("ruqyah.title")} subtitle={t("ruqyah.desc")} />
      <RuqyahView content={content} />
    </>
  );
}
