"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock, Minus, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import { KEYS, lessonHref } from "./shared";
import { Progress } from "./seerah-timeline";
import { useSeerahProgress } from "./use-seerah-progress";

const MIN_SCALE = 0.8, MAX_SCALE = 1.6, STEP = 0.1;

type Nav = { chapterId: string; slug: string; title: string } | null;

/**
 * Wraps a server-rendered lesson: font size, read state, and prev/next across
 * the whole book. As in the app, a lesson is opened → remembered as the last one,
 * and counts as read once its end scrolls into view (or "next" is pressed).
 */
export function LessonReader({
  lessonId,
  minutes,
  index,
  total,
  prev,
  next,
  children,
}: {
  lessonId: string;
  minutes: number;
  index: number;
  total: number;
  prev: Nav;
  next: Nav;
  children: ReactNode;
}) {
  const t = useTranslations("seerah");
  const locale = useLocale();
  const d = (n: number) => toLocaleDigits(n, locale);
  const { read, loaded, markRead, toggleRead, opened } = useSeerahProgress();
  const [scale, setScale] = useLocalStorage<number>(KEYS.fontScale, 1);
  const end = useRef<HTMLDivElement>(null);
  const isRead = read.has(lessonId);
  const size = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(scale) || 1));
  const zoom = (delta: number) => setScale(Math.round(Math.min(MAX_SCALE, Math.max(MIN_SCALE, size + delta)) * 10) / 10);

  useEffect(() => {
    opened(lessonId);
  }, [lessonId, opened]);

  useEffect(() => {
    const el = end.current;
    if (!el || !loaded) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        markRead(lessonId);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [lessonId, loaded, markRead]);

  const Prev = locale === "ar" ? ArrowRight : ArrowLeft;
  const Next = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <span className="shrink-0 text-xs font-bold text-muted-foreground">
          {t("lessonOf", { index: d(index + 1), total: d(total) })}
        </span>
        <Progress value={(index + 1) / total} className="flex-1" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {t("readTime", { count: d(minutes) })}
          </span>
          <button
            type="button"
            onClick={() => toggleRead(lessonId)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition hover:border-brand/50",
              isRead && "border-brand/40 text-brand",
            )}
            title={isRead ? t("markUnread") : t("markRead")}
          >
            {isRead ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />}
            {isRead ? t("read") : t("markRead")}
          </button>
        </div>
        <div className="flex items-center gap-1" role="group" aria-label={t("fontSize")}>
          <button type="button" onClick={() => zoom(-STEP)} disabled={size <= MIN_SCALE} aria-label={t("smaller")} className="grid size-8 place-items-center rounded-lg border bg-card disabled:opacity-40">
            <Minus className="size-3.5" />
          </button>
          <span className="w-10 text-center tabular-nums">{d(Math.round(size * 100))}%</span>
          <button type="button" onClick={() => zoom(STEP)} disabled={size >= MAX_SCALE} aria-label={t("larger")} className="grid size-8 place-items-center rounded-lg border bg-card disabled:opacity-40">
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      <div
        dir="rtl"
        lang="ar"
        className="rounded-2xl border bg-card p-5 leading-[1.95] [--seerah-quote:#8a5a12] sm:p-8 dark:[--seerah-quote:#e6c98a]"
        style={{ fontSize: `${1.0625 * size}rem` }}
      >
        {children}
        <p className="mt-6 text-center text-sm font-bold text-gold">صلى الله عليه وسلم</p>
        <div ref={end} aria-hidden className="h-px" />
      </div>

      <nav className="mt-6 flex items-stretch gap-3">
        {prev ? (
          <Link
            href={lessonHref(prev)}
            aria-label={t("previous")}
            title={prev.title}
            className="grid w-12 shrink-0 place-items-center rounded-xl border bg-card transition hover:border-brand/50"
          >
            <Prev className="size-5" />
          </Link>
        ) : (
          <span className="grid w-12 shrink-0 place-items-center rounded-xl border bg-card opacity-40">
            <Prev className="size-5" />
          </span>
        )}
        <Link
          href={next ? lessonHref(next) : "/seerah"}
          onClick={() => markRead(lessonId)}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-primary-foreground transition hover:brightness-110"
        >
          <span className="min-w-0 text-center">
            <span className="block text-sm font-bold">{next ? t("next") : t("finish")}</span>
            {next && <span className="block truncate text-xs opacity-80" dir="rtl">{next.title}</span>}
          </span>
          <Next className="size-5 shrink-0" />
        </Link>
      </nav>
    </>
  );
}
