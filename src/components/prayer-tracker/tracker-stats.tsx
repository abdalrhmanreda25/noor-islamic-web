"use client";

import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { addDays, bestStreak, dayKey, daysInMonth, fmtDate } from "./dates";
import { isFullDay, PRAYER_KEYS, prayedCount, STATE_STYLE, STATES, type PrayerLog, type State } from "./storage";

/** Prev / next arrows that point the right way in both directions. */
function Pager({ label, onPrev, onNext, canNext }: { label: string; onPrev: () => void; onNext: () => void; canNext: boolean }) {
  const t = useTranslations("prayer-tracker");
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <button type="button" onClick={onPrev} aria-label={t("previous")} className="rounded-full p-1.5 hover:bg-muted">
        <ChevronRight className="size-5 ltr:rotate-180" />
      </button>
      <p className="font-bold" suppressHydrationWarning>
        {label}
      </p>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label={t("next")}
        className="rounded-full p-1.5 hover:bg-muted disabled:opacity-30"
      >
        <ChevronLeft className="size-5 ltr:rotate-180" />
      </button>
    </div>
  );
}

function Legend() {
  const t = useTranslations("prayer-tracker");
  return (
    <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
      {STATES.map((s) => (
        <span key={s} className="flex items-center gap-1.5">
          <span className={cn("size-3 rounded", STATE_STYLE[s].bg)} /> {t(`states.${s}`)}
        </span>
      ))}
    </div>
  );
}

/** 7 days × 5 prayers grid, one week at a time. */
export function WeekView({ log, today, onSelect }: { log: PrayerLog; today: Date; onSelect: (k: string) => void }) {
  const tp = useTranslations("prayer");
  const t = useTranslations("prayer-tracker");
  const locale = useLocale();
  const [offset, setOffset] = useState(0);
  const end = addDays(today, -7 * offset);
  const days = Array.from({ length: 7 }, (_, i) => addDays(end, i - 6));
  const prayed = days.reduce((s, d) => s + prayedCount(log[dayKey(d)]), 0);
  const range = `${fmtDate(days[0], locale, { day: "numeric", month: "short" })} – ${fmtDate(end, locale, { day: "numeric", month: "short" })}`;

  return (
    <div className="rounded-2xl border bg-card p-5">
      <Pager label={range} onPrev={() => setOffset((o) => o + 1)} onNext={() => setOffset((o) => o - 1)} canNext={offset > 0} />
      <div className="grid grid-cols-[auto_repeat(7,minmax(0,1fr))] items-center gap-1.5 text-center">
        <span />
        {days.map((d) => (
          <button key={dayKey(d)} type="button" onClick={() => onSelect(dayKey(d))} className="rounded-lg py-1 hover:bg-muted">
            <span className="block text-[11px] text-muted-foreground">{fmtDate(d, locale, { weekday: "short" })}</span>
            <span className="block text-sm font-bold">{toLocaleDigits(d.getDate(), locale)}</span>
          </button>
        ))}
        {PRAYER_KEYS.map((p) => (
          <div key={p} className="contents">
            <span className="pe-2 text-start text-sm font-medium">{tp(p)}</span>
            {days.map((d) => {
              const s: State | undefined = log[dayKey(d)]?.[p];
              return (
                <span
                  key={dayKey(d)}
                  title={t(`states.${s ?? "none"}`)}
                  className={cn("mx-auto h-7 w-full max-w-10 rounded-lg", s ? STATE_STYLE[s].bg : "bg-muted")}
                />
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        {t("weekSummary", { done: toLocaleDigits(prayed, locale), total: toLocaleDigits(35, locale) })}
      </p>
      <Legend />
    </div>
  );
}

/** Month heatmap (prayed count per day), per-status counts and best streak. */
export function MonthView({ log, today, onSelect }: { log: PrayerLog; today: Date; onSelect: (k: string) => void }) {
  const t = useTranslations("prayer-tracker");
  const locale = useLocale();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const y = month.getFullYear();
  const m = month.getMonth();
  const total = daysInMonth(y, m);
  const isCurrent = y === today.getFullYear() && m === today.getMonth();
  const dueDays = isCurrent ? today.getDate() : total;
  const prefix = dayKey(month).slice(0, 8);
  const entries = Object.entries(log).filter(([k]) => k.startsWith(prefix));
  const counts = Object.fromEntries(STATES.map((s) => [s, 0])) as Record<State, number>;
  for (const [, d] of entries) for (const p of PRAYER_KEYS) if (d[p]) counts[d[p]!]++;
  const prayed = counts.jamaah + counts.alone + counts.qada;
  const pct = Math.min(100, Math.round((prayed / (5 * dueDays)) * 100));
  const best = bestStreak(Object.keys(log).filter((k) => isFullDay(log[k])));
  // Week starts on Saturday, as in the app's heatmap.
  const lead = (month.getDay() + 1) % 7;
  const weekdays = Array.from({ length: 7 }, (_, i) => fmtDate(new Date(2024, 0, 6 + i), locale, { weekday: "narrow" }));
  const n = (v: number) => toLocaleDigits(v, locale);

  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
      <div className="rounded-2xl border bg-card p-5">
        <Pager
          label={fmtDate(month, locale, { month: "long", year: "numeric" })}
          onPrev={() => setMonth(new Date(y, m - 1, 1))}
          onNext={() => setMonth(new Date(y, m + 1, 1))}
          canNext={!isCurrent}
        />
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekdays.map((w, i) => (
            <span key={i} className="text-xs text-muted-foreground">
              {w}
            </span>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`x${i}`} />
          ))}
          {Array.from({ length: total }, (_, i) => {
            const d = new Date(y, m, i + 1);
            const k = dayKey(d);
            const c = prayedCount(log[k]);
            const future = d > today;
            return (
              <button
                key={k}
                type="button"
                disabled={future}
                onClick={() => onSelect(k)}
                title={`${c}/5`}
                className={cn(
                  "aspect-square rounded-lg text-xs font-semibold tabular-nums transition hover:ring-2 hover:ring-brand/40 disabled:opacity-30",
                  c === 5 ? "bg-brand text-white" : c > 0 ? "text-foreground" : "bg-muted text-muted-foreground",
                )}
                style={c > 0 && c < 5 ? { backgroundColor: `color-mix(in oklch, var(--brand) ${c * 18}%, var(--muted))` } : undefined}
              >
                {n(i + 1)}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          {t("less")}
          {[0, 1, 2, 3, 4, 5].map((c) => (
            <span
              key={c}
              className={cn("size-3 rounded", c === 0 ? "bg-muted" : c === 5 && "bg-brand")}
              style={c > 0 && c < 5 ? { backgroundColor: `color-mix(in oklch, var(--brand) ${c * 18}%, var(--muted))` } : undefined}
            />
          ))}
          {t("more")}
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t("monthPrayed")}</p>
          <p className="mt-1 text-3xl font-bold text-brand">
            {n(prayed)} <span className="text-base font-medium text-muted-foreground">/ {n(5 * dueDays)}</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {STATES.map((s) => (
            <div key={s} className="rounded-2xl border bg-card p-4">
              <span className={cn("inline-block size-3 rounded", STATE_STYLE[s].bg)} />
              <p className="mt-1 text-2xl font-bold">{n(counts[s])}</p>
              <p className="text-sm text-muted-foreground">{t(`states.${s}`)}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
          <Trophy className="size-8 text-gold" />
          <div>
            <p className="text-2xl font-bold">{n(best)}</p>
            <p className="text-sm text-muted-foreground">{t("bestStreak")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
