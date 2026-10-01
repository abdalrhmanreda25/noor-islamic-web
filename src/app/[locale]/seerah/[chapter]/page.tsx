import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/page-header";
import { ChapterView } from "@/components/seerah/chapter-view";
import { routing } from "@/i18n/routing";
import { getSeerahChapter, getSeerahIndex } from "@/lib/data/seerah";

export const dynamicParams = false;

export async function generateStaticParams() {
  const chapters = (await getSeerahIndex()).flatMap((p) => p.chapters);
  return routing.locales.flatMap((locale) => chapters.map((c) => ({ locale, chapter: c.id })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/seerah/[chapter]">) {
  const { chapter } = await params;
  return { title: (await getSeerahChapter(chapter))?.chapter.title };
}

export default async function SeerahChapterPage({ params }: PageProps<"/[locale]/seerah/[chapter]">) {
  const { locale, chapter: id } = await params;
  setRequestLocale(locale);
  const found = await getSeerahChapter(id);
  if (!found) notFound();
  const tf = await getTranslations("features");
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/seerah" className="text-sm text-brand hover:underline">{tf("seerah.title")}</Link>
      <div dir="rtl">
        <PageHeader title={found.chapter.title} subtitle={`${found.part.title} · ${found.part.subtitle}`} />
      </div>
      <ChapterView chapter={found.chapter} />
    </div>
  );
}
