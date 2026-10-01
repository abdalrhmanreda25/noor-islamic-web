import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/page-header";
import { SeerahSearch } from "@/components/seerah/seerah-search";
import type { LessonLink } from "@/components/seerah/shared";
import { getSeerahLessons, getSeerahSearchIndex } from "@/lib/data/seerah";

export async function generateMetadata() {
  return { title: (await getTranslations("seerah"))("searchTitle") };
}

export default async function SeerahSearchPage({ params }: PageProps<"/[locale]/seerah/search">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tf, entries, refs] = await Promise.all([
    getTranslations("seerah"),
    getTranslations("features"),
    getSeerahSearchIndex(),
    getSeerahLessons(),
  ]);
  const lessons = Object.fromEntries(
    refs.map(({ id, slug, title, minutes, chapterId, chapterTitle }): [string, LessonLink] => [
      id,
      { id, slug, title, minutes, chapterId, chapterTitle },
    ]),
  );
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/seerah" className="text-sm text-brand hover:underline">{tf("seerah.title")}</Link>
      <PageHeader title={t("searchTitle")} />
      <SeerahSearch entries={entries} lessons={lessons} />
    </div>
  );
}
