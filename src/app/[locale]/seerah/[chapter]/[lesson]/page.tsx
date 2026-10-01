import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BlockView } from "@/components/seerah/block-view";
import { LessonReader } from "@/components/seerah/lesson-reader";
import { ACCENT } from "@/components/seerah/shared";
import { routing } from "@/i18n/routing";
import { getSeerahChapterLessons, getSeerahLessons } from "@/lib/data/seerah";
import { cn } from "@/lib/utils";

export const dynamicParams = false;

export async function generateStaticParams() {
  const lessons = await getSeerahLessons();
  return routing.locales.flatMap((locale) =>
    lessons.map((l) => ({ locale, chapter: l.chapterId, lesson: l.slug })),
  );
}

async function find(chapter: string, slug: string) {
  const lessons = await getSeerahLessons();
  const i = lessons.findIndex((l) => l.chapterId === chapter && l.slug === slug);
  return i < 0 ? null : { ref: lessons[i], prev: lessons[i - 1] ?? null, next: lessons[i + 1] ?? null };
}

export async function generateMetadata({ params }: PageProps<"/[locale]/seerah/[chapter]/[lesson]">) {
  const { chapter, lesson } = await params;
  return { title: (await find(chapter, lesson))?.ref.title };
}

export default async function SeerahLessonPage({ params }: PageProps<"/[locale]/seerah/[chapter]/[lesson]">) {
  const { locale, chapter, lesson: slug } = await params;
  setRequestLocale(locale);
  const found = await find(chapter, slug);
  if (!found) notFound();
  const { ref, prev, next } = found;
  const [lessons, tf] = await Promise.all([getSeerahChapterLessons(chapter), getTranslations("features")]);
  const lesson = lessons.find((l) => l.id === ref.id);
  if (!lesson) notFound();
  const nav = (l: typeof prev) => (l ? { chapterId: l.chapterId, slug: l.slug, title: l.title } : null);

  return (
    <article className="mx-auto max-w-3xl">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm">
        <Link href="/seerah" className="text-brand hover:underline">{tf("seerah.title")}</Link>
        <span className="text-muted-foreground">/</span>
        <Link href={`/seerah/${chapter}`} className="text-brand hover:underline" dir="rtl">{ref.chapterTitle}</Link>
      </nav>
      <header className="mt-3 mb-5" dir="rtl">
        <p className="text-xs font-semibold text-muted-foreground">{ref.partTitle} · {ref.chapterPeriod}</p>
        <h1 className={cn("mt-1.5 text-2xl leading-snug font-extrabold sm:text-3xl", ACCENT)}>{lesson.title}</h1>
      </header>
      <LessonReader
        lessonId={lesson.id}
        minutes={lesson.minutes}
        index={ref.indexInChapter}
        total={ref.chapterSize}
        prev={nav(prev)}
        next={nav(next)}
      >
        {lesson.blocks.map((b, i) => <BlockView key={i} block={b} />)}
      </LessonReader>
    </article>
  );
}
