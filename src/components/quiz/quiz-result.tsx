"use client";

import {
  Award,
  Check,
  CheckCircle2,
  Flame,
  LayoutGrid,
  RefreshCw,
  RotateCcw,
  Share2,
  Sprout,
  Star,
  TrendingUp,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mistakes as getMistakes, ratio, scoreTier, TIER_TEXT, TIMED_OUT, type QuizSession } from "./session";

const TIER_ICON = { excellent: Trophy, great: Star, good: TrendingUp, start: Sprout } as const;

export function QuizResult({
  session,
  title,
  isNewBest,
  onRetryMistakes,
  onNewRound,
  onBack,
}: {
  session: QuizSession;
  title: string;
  isNewBest: boolean;
  onRetryMistakes: () => void;
  onNewRound: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("quiz");
  const locale = useLocale();
  const n = (v: number) => toLocaleDigits(v, locale);
  const [copied, setCopied] = useState(false);
  const total = session.questions.length;
  const r = ratio(session.score, total);
  const percent = Math.round(r * 100);
  const tier = scoreTier(r);
  const TierIcon = TIER_ICON[tier];
  const missed = getMistakes(session);
  const R = 70;
  const C = 2 * Math.PI * R;

  const share = async () => {
    const text = t("shareText", { score: n(session.score), total: n(total), percent: n(percent), title });
    try {
      if (navigator.share) {
        await navigator.share({ text: `${text}\n${location.href}` });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${location.href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const numbers = [
    { icon: CheckCircle2, value: session.score, label: t("correct") },
    { icon: XCircle, value: total - session.score, label: t("wrong") },
    { icon: Flame, value: session.bestStreak, label: t("stats.bestStreak") },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-card p-5 text-center sm:p-7">
        <div className={cn("relative mx-auto size-44", TIER_TEXT[tier])}>
          <svg viewBox="0 0 160 160" className="size-full -rotate-90">
            <circle cx="80" cy="80" r={R} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth="12" />
            <circle
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - r)}
              className="transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <div className="absolute inset-0 grid place-content-center">
            <p dir="ltr" className="text-3xl font-extrabold text-foreground tabular-nums">
              {n(session.score)}/{n(total)}
            </p>
            <p className="font-bold">{n(percent)}%</p>
          </div>
        </div>

        {isNewBest && (
          <p className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/15 px-3.5 py-1.5 text-sm font-bold">
            <Award className="size-4 text-gold" />
            {t("newBest")}
          </p>
        )}

        <TierIcon className={cn("mx-auto mt-4 size-8", TIER_TEXT[tier])} />
        <p className="mt-1 text-lg font-extrabold">{t(`tiers.${tier}.title`)}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{t(`tiers.${tier}.body`)}</p>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-secondary/60 py-3">
          {numbers.map(({ icon: Icon, value, label }) => (
            <div key={label}>
              <Icon className="mx-auto size-5 text-brand" />
              <p className="mt-0.5 text-lg font-extrabold tabular-nums">{n(value)}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-2.5">
        {missed.length > 0 && (
          <Button size="lg" className="h-11 rounded-xl" onClick={onRetryMistakes}>
            <RotateCcw />
            {t("retryMistakes", { n: n(missed.length) })}
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            size="lg"
            variant={missed.length ? "outline" : "default"}
            className="h-11 rounded-xl"
            onClick={onNewRound}
          >
            <RefreshCw />
            {t("newRound")}
          </Button>
          <Button size="lg" variant="outline" className="h-11 rounded-xl" onClick={share}>
            {copied ? <Check /> : <Share2 />}
            <span className="truncate">{copied ? t("copied") : t("share")}</span>
          </Button>
        </div>
        <Button size="lg" variant="outline" className="h-11 rounded-xl" onClick={onBack}>
          <LayoutGrid />
          {t("backToCategories")}
        </Button>
      </div>

      {missed.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <span className="h-5 w-1 rounded-full bg-gold" />
            {t("reviewTitle")}
          </h2>
          {missed.map(({ question: q, pick }, i) => (
            <div key={i} className="rounded-2xl border bg-card p-5">
              <p dir="rtl" className="leading-8 font-bold">
                {q.q}
              </p>
              <p className="mt-2 flex items-start gap-2 text-destructive">
                <X className="mt-1 size-4 shrink-0" />
                <span>
                  {pick === TIMED_OUT ? t("timedOut") : t("yourAnswer", { answer: q.c[pick] })}
                </span>
              </p>
              <p className="mt-1 flex items-start gap-2 text-brand">
                <Check className="mt-1 size-4 shrink-0" />
                <span>{t("rightAnswer", { answer: q.c[q.a] })}</span>
              </p>
              {q.e && (
                <p dir="rtl" className="mt-2 border-t pt-2 text-sm leading-7 text-muted-foreground">
                  {q.e}
                </p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
