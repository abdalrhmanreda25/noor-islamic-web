"use client";

import { BookOpen, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import type { SeerahChapter } from "@/lib/data/seerah";
import { cn } from "@/lib/utils";
import { ACCENT, ChapterIcon, lessonHref } from "./shared";
import { Progress } from "./seerah-timeline";
import { useSeerahProgress } from "./use-seerah-progress";

/** The app's SeerahChapterScreen: summary card with progress, then the lessons. */
export function ChapterView({ chapter }: { chapter: SeerahChapter }) {
  const t = useTranslations("seerah");
  const locale = useLocale();
  const { read } = useSeerahProgress();
  const d = (n: number) => toLocaleDigits(n, locale);
  const total = chapter.lessons.length;
  const done = chapter.lessons.filter((l) => read.has(l.id)).length;
  const start = chapter.lessons.find((l) => !read.has(l.id)) ?? chapter.lessons[0];

  return (
    <div className="space-y-4">
      <section className="hero-gradient rounded-2xl p-5 text-white shadow-lg shadow-primary/20 sm:p-6">
        <div className="flex items-center gap-3">
          <ChapterIcon id={chapter.id} className="size-7 text-gold" />
          <p className="text-sm font-semibold text-white/75" dir="rtl">{chapter.period}</p>
        </div>
        <p className="mt-3 font-bold">
          {t("chapterSummary", { n: total, count: d(total), minutes: d(chapter.minutes) })}
        </p>
        <Progress value={done / total} className="mt-3 h-2 bg-white/20" />
        <p className="mt-1.5 text-xs text-white/75">
          {done === total ? t("chapterDone") : t("readOf", { read: d(done), total: d(total) })}
        </p>
        <Link
          href={lessonHref({ chapterId: chapter.id, slug: start.slug })}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-primary transition hover:brightness-105 dark:text-primary-foreground"
        >
          <BookOpen className="size-4" />
          {done === 0 ? t("startReading") : done === total ? t("readAgain") : t("continue")}
        </Link>
      </section>

      <ol className="grid gap-2.5" dir="rtl">
        {chapter.lessons.map((l, i) => {
          const isRead = read.has(l.id);
          return (
            <li key={l.id}>
              <Link
                href={lessonHref({ chapterId: chapter.id, slug: l.slug })}
                className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 transition hover:border-brand/50"
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold",
                    isRead ? "bg-brand text-white" : cn("bg-secondary", ACCENT),
                  )}
                >
                  {isRead ? <Check className="size-4" /> : d(i + 1)}
                </span>
                <span className={cn("min-w-0 flex-1 leading-snug font-bold", isRead && "text-muted-foreground")}>{l.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground" dir={locale === "ar" ? "rtl" : "ltr"}>
                  {t("minutes", { count: d(l.minutes) })}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
