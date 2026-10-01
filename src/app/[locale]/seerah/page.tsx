import { getTranslations, setRequestLocale } from "next-intl/server";
import { SeerahHero } from "@/components/seerah/seerah-hero";
import { SeerahTimeline } from "@/components/seerah/seerah-timeline";
import type { LessonLink } from "@/components/seerah/shared";
import { getSeerahIndex, getSeerahLessons } from "@/lib/data/seerah";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("seerah.title") };
}

export default async function SeerahPage({ params }: PageProps<"/[locale]/seerah">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [parts, refs] = await Promise.all([getSeerahIndex(), getSeerahLessons()]);
  const lessons: LessonLink[] = refs.map(({ id, slug, title, minutes, chapterId, chapterTitle }) => ({
    id, slug, title, minutes, chapterId, chapterTitle,
  }));
  return (
    <div className="mx-auto max-w-5xl">
      <SeerahHero chapters={parts.reduce((n, p) => n + p.chapters.length, 0)} lessons={lessons.length} />
      <SeerahTimeline parts={parts} lessons={lessons} />
    </div>
  );
}
