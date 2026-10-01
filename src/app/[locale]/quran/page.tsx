import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { QuranIndex } from "@/components/quran/quran-index";
import { getSurahs } from "@/lib/data";
import { getMushafIndex } from "@/lib/data/quran-pages";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("quran.title") };
}

export default async function QuranPage({ params }: PageProps<"/[locale]/quran">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, surahs, index] = await Promise.all([getTranslations("features"), getSurahs(), getMushafIndex()]);
  return (
    <>
      <PageHeader title={t("quran.title")} subtitle={t("quran.desc")} />
      <QuranIndex
        // Start pages from the mushaf layout the reader renders.
        surahs={surahs.map((s, i) => ({ ...s, startPage: index.surahs[i].page }))}
        juz={index.juz}
        quarters={index.quarters}
        pageSurah={index.pages.map((p) => p.surah)}
      />
    </>
  );
}
