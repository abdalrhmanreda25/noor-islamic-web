"use client";

import {
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Crosshair,
  Flag,
  Flame,
  History,
  PlayCircle,
  Shuffle,
  Timer,
  Trophy,
  BarChart3,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toLocaleDigits } from "@/components/page-header";
import { Switch } from "@/components/ui/switch";
import type { QuizBank, QuizCategoryId } from "@/lib/data/quiz";
import { cn } from "@/lib/utils";
import { CATEGORY_ICONS } from "./meta";
import { QUESTIONS_PER_ROUND, SECONDS_PER_QUESTION, type DailyResult, type QuizStats } from "./session";

export function QuizHome({
  bank,
  stats,
  best,
  plays,
  daily,
  timer,
  onTimer,
  onHistory,
  onDaily,
  onMixed,
  onCategory,
}: {
  bank: QuizBank;
  stats: QuizStats;
  best: Partial<Record<QuizCategoryId, number>>;
  plays: Partial<Record<QuizCategoryId, number>>;
  daily: DailyResult | null;
  timer: boolean;
  onTimer: (v: boolean) => void;
  onHistory: () => void;
  onDaily: () => void;
  onMixed: () => void;
  onCategory: (id: QuizCategoryId) => void;
}) {
  const t = useTranslations("quiz");
  const locale = useLocale();
  const n = (v: number) => toLocaleDigits(v, locale);
  const total = bank.reduce((sum, c) => sum + c.questions.length, 0);
  const accuracy = stats.answered === 0 ? 0 : Math.round((stats.correct * 100) / stats.answered);

  const statItems = [
    { icon: Flag, value: n(stats.rounds), label: t("stats.rounds") },
    { icon: CircleHelp, value: n(stats.answered), label: t("stats.answered") },
    { icon: Crosshair, value: `${n(accuracy)}%`, label: t("stats.accuracy") },
    { icon: Flame, value: n(stats.bestStreak), label: t("stats.bestStreak") },
  ];

  return (
    <div className="space-y-6">
      <section className="hero-gradient relative overflow-hidden rounded-2xl p-5 text-white shadow-xl shadow-primary/30 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gold/15">
            <Trophy className="size-8 text-gold" />
          </span>
          <div className="min-w-0">
            <p className="text-xl font-bold sm:text-2xl">{t("heroTitle")}</p>
            <p className="mt-1 leading-7 text-white/80">{t("heroBody")}</p>
            <p className="mt-3 inline-block rounded-full bg-white/10 px-3 py-1 text-sm text-gold">
              {t("heroCount", { count: n(total), cats: n(bank.length) })}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="size-5 text-brand" />
          <h2 className="flex-1 font-bold">{t("stats.title")}</h2>
          <button
            type="button"
            onClick={onHistory}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-brand hover:bg-muted"
          >
            <History className="size-4" />
            {t("stats.history")}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statItems.map(({ icon: Icon, value, label }) => (
            <div key={label} className="rounded-xl bg-secondary/60 p-3 text-center">
              <Icon className="mx-auto size-5 text-gold" />
              <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onDaily}
          className="hero-gradient flex items-center gap-4 rounded-2xl p-5 text-start text-white transition hover:shadow-lg hover:shadow-primary/30"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/20">
            {daily ? <CheckCircle2 className="size-6 text-gold" /> : <CalendarDays className="size-6 text-gold" />}
          </span>
          <span className="min-w-0">
            <span className="block font-bold">{t("modes.daily")}</span>
            <span className="mt-0.5 block text-sm text-white/75">
              {daily
                ? t("dailyDone", { score: n(daily.score), total: n(daily.total) })
                : t("dailySubtitle")}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onMixed}
          className="flex items-center gap-4 rounded-2xl border bg-card p-5 text-start transition hover:border-brand/50"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand/10">
            <Shuffle className="size-6 text-brand" />
          </span>
          <span className="min-w-0">
            <span className="block font-bold">{t("modes.mixed")}</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">{t("mixedSubtitle")}</span>
          </span>
        </button>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border bg-card p-5">
        <Timer className="size-6 shrink-0 text-brand" />
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{t("timer.title")}</span>
          <span className="block text-sm text-muted-foreground">
            {t("timer.subtitle", { seconds: n(SECONDS_PER_QUESTION) })}
          </span>
        </span>
        <Switch checked={timer} onCheckedChange={onTimer} aria-label={t("timer.title")} />
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <span className="h-5 w-1 rounded-full bg-gold" />
          {t("chooseCategory")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bank
            .filter((c) => c.questions.length > 0)
            .map(({ id, questions }) => {
              const Icon = CATEGORY_ICONS[id];
              const played = plays[id] ?? 0;
              const top = best[id] ?? 0;
              const of = Math.min(QUESTIONS_PER_ROUND, questions.length);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onCategory(id)}
                  className="group flex flex-col gap-3 rounded-2xl border bg-card p-5 text-start transition hover:border-brand/50"
                >
                  <span className="flex items-start gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/15">
                      <Icon className="size-6 text-gold" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{t(`categories.${id}.title`)}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {t(`categories.${id}.subtitle`)} • {t("questionCount", { count: n(questions.length) })}
                      </span>
                    </span>
                    <PlayCircle className="size-7 shrink-0 text-brand transition group-hover:scale-110" />
                  </span>
                  {played === 0 ? (
                    <span className="text-xs text-muted-foreground">{t("notPlayed")}</span>
                  ) : (
                    <span className="space-y-1.5">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-brand">
                        <Trophy className="size-3.5 text-gold" />
                        {t("bestOf", { best: n(top), of: n(of), plays: played, playsN: n(played) })}
                      </span>
                      <span className="block h-1.5 overflow-hidden rounded-full bg-brand/10">
                        <span
                          className={cn("block h-full rounded-full bg-gold")}
                          style={{ width: `${(top / of) * 100}%` }}
                        />
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </section>
    </div>
  );
}
