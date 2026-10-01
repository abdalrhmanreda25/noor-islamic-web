import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { FortressList } from "@/components/muslim-fortress/fortress-list";
import { getHisnChapters } from "@/lib/data/muslim-fortress";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("muslim-fortress.title") };
}

export default async function MuslimFortressPage({ params }: PageProps<"/[locale]/muslim-fortress">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, chapters] = await Promise.all([getTranslations("features"), getHisnChapters()]);
  return (
    <>
      <PageHeader title={t("muslim-fortress.title")} subtitle={t("muslim-fortress.desc")} />
      <FortressList
        chapters={chapters.map((c) => ({
          n: c.n,
          title: c.title,
          count: c.items.length,
          text: c.items.map((i) => i.content).join(" "),
        }))}
      />
    </>
  );
}
