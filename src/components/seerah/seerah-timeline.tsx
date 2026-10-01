"use client";

import { BookOpen, CheckCircle2, Play, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import type { SeerahPart } from "@/lib/data/seerah";
import { cn } from "@/lib/utils";
import { ACCENT, ChapterIcon, lessonHref, PartIcon, type LessonLink } from "./shared";
import { useSeerahProgress } from "./use-seerah-progress";

export function Progress({ value, className, bar }: { value: number; className?: string; bar?: string }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-secondary", className)}>
      <div className={cn("h-full rounded-full bg-gold transition-[width]", bar)} style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

/** Seerah home below the banner: resume card, search, and the parts → chapters timeline. */
export function SeerahTimeline({ parts, lessons }: { parts: SeerahPart[]; lessons: LessonLink[] }) {
  const t = useTranslations("seerah");
  const locale = useLocale();
  const router = useRouter();
  const { read, last } = useSeerahProgress();
  const [query, setQuery] = useState("");
  const d = (n: number) => toLocaleDigits(n, locale);

  // SeerahCubit.continueLesson: the last lesson opened, or the next one once it was finished.
  const lastIndex = last ? lessons.findIndex((l) => l.id === last) : -1;
  const resumeIndex = lastIndex < 0 ? -1 : read.has(lessons[lastIndex].id) ? lastIndex + 1 : lastIndex;
  const started = resumeIndex >= 0 && resumeIndex < lessons.length;
  const resume = lessons[started ? resumeIndex : 0];
  const readCount = lessons.filter((l) => read.has(l.id)).length;

  return (
    <div className="space-y-4">
      <Link
        href={lessonHref(resume)}
        className="hero-gradient flex items-center gap-4 rounded-2xl p-4 text-white shadow-lg shadow-primary/20 transition hover:brightness-110 sm:p-5"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold text-primary dark:text-primary-foreground">
          {started ? <Play className="size-6 fill-current" /> : <BookOpen className="size-6" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white/70">{started ? t("continue") : t("startJourney")}</p>
          <p className="truncate font-extrabold sm:text-lg" dir="rtl">{resume.title}</p>
          <p className="truncate text-xs text-white/70">
            <span dir="rtl">{resume.chapterTitle}</span> · {t("minutes", { count: d(resume.minutes) })}
          </p>
          <Progress value={readCount / lessons.length} className="mt-2 bg-white/20" />
          <p className="mt-1 text-[11px] text-white/70">
            {t("completed", { read: d(readCount), total: d(lessons.length) })}
          </p>
        </div>
      </Link>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/seerah/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
        }}
        className="flex items-center gap-2.5 rounded-2xl border bg-card px-4 py-1.5 focus-within:border-brand/60"
      >
        <Search className={cn("size-5 shrink-0", ACCENT)} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button type="submit" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          {t("search")}
        </button>
      </form>

      <ol className="relative mt-8 space-y-8" dir="rtl">
        <span aria-hidden className="absolute inset-y-2 start-[1.1875rem] w-0.5 rounded-full bg-gradient-to-b from-gold/70 via-brand/40 to-gold/20" />
        {parts.map((part) => {
          return (
            <li key={part.id} className="relative">
              <div className="flex items-center gap-3">
                <span className="hero-gradient relative grid size-10 shrink-0 place-items-center rounded-full text-gold ring-4 ring-background">
                  <PartIcon id={part.id} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className={cn("text-lg font-extrabold", ACCENT)}>{part.title}</h2>
                  <p className="text-xs text-muted-foreground">{part.subtitle}</p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                  {part.period}
                </span>
              </div>
              <ul className="mt-3 grid gap-3 ps-14 lg:grid-cols-2">
                {part.chapters.map((ch) => {
                  const total = ch.lessons.length;
                  const done = ch.lessons.filter((l) => read.has(l.id)).length;
                  const complete = done === total;
                  return (
                    <li key={ch.id} className="group relative">
                      <span aria-hidden className="absolute -start-[2.5625rem] top-1/2 lg:group-even:hidden size-3 -translate-y-1/2 rounded-full border-2 border-gold bg-background" />
                      <Link
                        href={`/seerah/${ch.id}`}
                        className="flex items-center gap-3 rounded-2xl border bg-card p-3 transition hover:border-brand/50 sm:p-4"
                      >
                        <span className="hero-gradient grid size-12 shrink-0 place-items-center rounded-xl text-white">
                          <ChapterIcon id={ch.id} className="size-6" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold">{ch.title}</p>
                          <p className="text-xs text-muted-foreground">
                            <bdi>{ch.period}</bdi> · <bdi>{t("chapterLessons", { n: total, count: d(total) })}</bdi> · <bdi>{t("minutes", { count: d(ch.minutes) })}</bdi>
                          </p>
                          <Progress value={done / total} className="mt-2" bar={complete ? "bg-brand" : undefined} />
                        </div>
                        {complete ? (
                          <CheckCircle2 className="size-5 shrink-0 text-brand" />
                        ) : (
                          <span className="shrink-0 text-xs font-bold text-muted-foreground tabular-nums">
                            {d(done)}/{d(total)}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
