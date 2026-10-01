"use client";

import { ArrowRight, Bookmark, CheckCircle2, Flame, Info, Star, Timer, TimerOff, Trophy, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORY_ICONS } from "./meta";
import { TIMED_OUT, type QuizSession } from "./session";

export function QuizSessionView({
  session,
  roundId,
  timerSeconds,
  onSelect,
  onTimeout,
  onNext,
}: {
  session: QuizSession;
  /** Changes for every new round, so the timer restarts even on a repeated question. */
  roundId: number;
  /** null when the timer is off. */
  timerSeconds: number | null;
  onSelect: (i: number) => void;
  onTimeout: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("quiz");
  const locale = useLocale();
  const n = (v: number) => toLocaleDigits(v, locale);
  const q = session.questions[session.index];
  const pick = session.picks[session.index];
  const answered = pick != null;
  const isLast = session.index + 1 >= session.questions.length;
  const total = session.questions.length;
  const progress = (session.index + (answered ? 1 : 0)) / total;
  const CatIcon = CATEGORY_ICONS[q.cat];

  // Keyboard: 1–9 picks a choice, Enter moves on.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input,textarea,[role=dialog]")) return;
      const digit = Number(e.key);
      if (!answered && digit >= 1 && digit <= q.c.length) onSelect(digit - 1);
      else if (answered && e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, q, onSelect, onNext]);

  const status = !answered ? null : pick === q.a ? "correct" : pick === TIMED_OUT ? "timeout" : "wrong";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="flex-1 font-bold text-brand">
            {t("questionOf", { n: n(session.index + 1), total: n(total) })}
          </span>
          {session.streak >= 2 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 font-medium text-amber-600 dark:text-amber-400">
              <Flame className="size-3.5" />
              {t("streak", { n: n(session.streak) })}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-0.5 font-medium">
            <Star className="size-3.5 text-gold" />
            {t("score", { n: n(session.score) })}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-brand/10">
          <div className="h-full rounded-full bg-gold transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {timerSeconds != null && (
        <TimerBar
          key={`${roundId}-${session.index}`}
          seconds={timerSeconds}
          running={!answered}
          onTimeout={onTimeout}
        />
      )}

      <div className="rounded-2xl border bg-card p-5">
        <p className="flex items-center gap-1.5 text-xs font-medium text-brand">
          <CatIcon className="size-3.5" />
          {t(`categories.${q.cat}.title`)}
        </p>
        <p dir="rtl" className="mt-3 text-lg leading-9 font-bold sm:text-xl">
          {q.q}
        </p>
      </div>

      <div className="grid gap-2.5">
        {q.c.map((choice, i) => {
          const isCorrect = i === q.a;
          const isPicked = i === pick;
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => onSelect(i)}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 bg-card px-4 py-3.5 text-start font-medium transition disabled:cursor-default",
                !answered && "hover:border-brand/50 hover:bg-brand/5",
                answered && isCorrect && "border-brand bg-brand/10 text-brand",
                answered && isPicked && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                answered && !isCorrect && !isPicked && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground",
                  answered && isCorrect && "bg-brand text-primary-foreground",
                  answered && isPicked && !isCorrect && "bg-destructive text-white",
                )}
              >
                {n(i + 1)}
              </span>
              <span dir="rtl" className="flex-1 leading-7">
                {choice}
              </span>
              {answered && isCorrect && <CheckCircle2 className="size-5 shrink-0" />}
              {answered && isPicked && !isCorrect && <XCircle className="size-5 shrink-0" />}
            </button>
          );
        })}
      </div>

      {status && (
        <div
          className={cn(
            "rounded-2xl border p-4",
            status === "correct" ? "border-brand/40 bg-brand/5" : "border-destructive/40 bg-destructive/5",
          )}
        >
          <p
            className={cn(
              "flex items-start gap-2 font-bold",
              status === "correct" ? "text-brand" : "text-destructive",
            )}
          >
            {status === "correct" ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            ) : status === "timeout" ? (
              <TimerOff className="mt-0.5 size-5 shrink-0" />
            ) : (
              <Info className="mt-0.5 size-5 shrink-0" />
            )}
            <span>
              {status === "correct"
                ? t("correctTitle")
                : t(status === "timeout" ? "timeoutTitle" : "wrongTitle", { answer: q.c[q.a] })}
            </span>
          </p>
          {q.e && (
            <p dir="rtl" className="mt-2 leading-8 text-foreground/85">
              {q.e}
            </p>
          )}
          {q.s && (
            <p dir="rtl" className="mt-2 flex items-center gap-1.5 text-sm text-gold">
              <Bookmark className="size-4 shrink-0" />
              {q.s}
            </p>
          )}
        </div>
      )}

      <Button size="lg" className="h-12 w-full rounded-xl text-base" disabled={!answered} onClick={onNext}>
        {!answered ? t("pickAnswer") : isLast ? t("showResult") : t("next")}
        {answered && (isLast ? <Trophy /> : <ArrowRight className="rtl:rotate-180" />)}
      </Button>
    </div>
  );
}

function TimerBar({ seconds, running, onTimeout }: { seconds: number; running: boolean; onTimeout: () => void }) {
  const t = useTranslations("quiz");
  const locale = useLocale();
  const [left, setLeft] = useState(seconds * 1000);
  const leftRef = useRef(seconds * 1000);
  const timeoutRef = useRef(onTimeout);

  useEffect(() => {
    timeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!running) return;
    const end = Date.now() + leftRef.current;
    const id = setInterval(() => {
      const l = Math.max(0, end - Date.now());
      leftRef.current = l;
      setLeft(l);
      if (l === 0) {
        clearInterval(id);
        timeoutRef.current();
      }
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  const frac = left / (seconds * 1000);
  const secondsLeft = Math.ceil(left / 1000);
  const tone = frac > 0.5 ? "brand" : frac > 0.2 ? "amber" : "red";
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        tone === "brand" ? "text-brand" : tone === "amber" ? "text-amber-500" : "text-destructive",
      )}
      role="timer"
      aria-label={t("secondsLeft", { n: toLocaleDigits(secondsLeft, locale) })}
    >
      <Timer className="size-4 shrink-0" />
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-current/15">
        <div className="h-full rounded-full bg-current transition-[width] duration-100 ease-linear" style={{ width: `${frac * 100}%` }} />
      </div>
      <span className="w-7 text-center text-sm font-bold tabular-nums">{toLocaleDigits(secondsLeft, locale)}</span>
    </div>
  );
}
