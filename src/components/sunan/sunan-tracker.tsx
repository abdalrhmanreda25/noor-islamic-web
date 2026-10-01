"use client";

import { CalendarDays, Check, Flame, Moon, Sun, Landmark } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import type { TrackedSunnah } from "@/lib/data/sunan";
import { cn } from "@/lib/utils";
import { addDays, dayKey, parseDay, sunanStats, useSunanLog } from "./use-sunan-log";

/** Today's checklist (hero card) plus a collapsible 30-day history, like the Flutter SunanTodayCard + SunanHistoryScreen. */
export function SunanTracker({ tracked }: { tracked: TrackedSunnah[] }) {
  const t = useTranslations("sunan");
  const locale = useLocale();
  const { log, today, toggle } = useSunanLog();
  const [showHistory, setShowHistory] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const stats = today ? sunanStats(log, today, tracked) : null;
  const todayKey = today ? dayKey(today) : "";
  const done = stats?.doneOn(todayKey) ?? [];
  const rakaat = stats?.rakaatOn(todayKey) ?? 0;
  const total = stats?.totalRakaat ?? 12;
  const rawatib = tracked.filter((s) => s.rakaat > 0);
  const others = tracked.filter((s) => s.rakaat === 0);
  const d = (n: number) => toLocaleDigits(n, locale);

  return (
    <div className="space-y-4">
      <section className="hero-gradient relative overflow-hidden rounded-2xl p-5 text-white shadow-xl shadow-primary/30 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gold">{t("today")}</h2>
            <p className="mt-1 text-sm text-white/80" suppressHydrationWarning>
              {rakaat >= total
                ? t("rawatibComplete")
                : t("rawatibProgress", { done: d(rakaat), total: d(total) })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats && stats.streak > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-3 py-1 text-sm font-bold text-gold"
                title={t("streakLabel")}
              >
                <Flame className="size-4" />
                {t("streak", { count: stats.streak, days: d(stats.streak) })}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              aria-expanded={showHistory}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm transition hover:bg-white/20"
            >
              <CalendarDays className="size-4" />
              {showHistory ? t("hideHistory") : t("history")}
            </button>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${(rakaat / total) * 100}%` }} />
        </div>

        <div className="mt-5 grid grid-cols-5 gap-1.5 sm:gap-3">
          {rawatib.map((s) => {
            const on = done.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                disabled={!today}
                onClick={() => toggle(todayKey, s.id)}
                aria-pressed={on}
                className="group flex flex-col items-center gap-1.5 text-center"
              >
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-full border-2 text-base font-bold transition sm:size-14 sm:text-lg",
                    on
                      ? "border-gold bg-gold text-primary"
                      : "border-white/30 bg-white/5 group-hover:border-gold/70",
                  )}
                >
                  {on ? <Check className="size-5 sm:size-6" /> : d(s.rakaat)}
                </span>
                <span className="text-[11px] leading-tight text-white/80 sm:text-xs">{t(`tracked.${s.id}`)}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {others.map((s) => {
            const on = done.includes(s.id);
            const Icon = s.id === "witr" ? Moon : Sun;
            return (
              <button
                key={s.id}
                type="button"
                disabled={!today}
                onClick={() => toggle(todayKey, s.id)}
                aria-pressed={on}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                  on ? "border-gold/60 bg-gold/15 text-gold" : "border-white/10 bg-white/5 hover:border-white/30",
                )}
              >
                {on ? <Check className="size-4" /> : <Icon className="size-4" />}
                {t(`tracked.${s.id}`)}
              </button>
            );
          })}
        </div>
      </section>

      {showHistory && stats && today && (
        <SunanHistory
          tracked={tracked}
          stats={stats}
          today={today}
          selected={selected ?? todayKey}
          onSelect={setSelected}
          onToggle={toggle}
        />
      )}
    </div>
  );
}

type Stats = ReturnType<typeof sunanStats>;

function shade(ratio: number) {
  if (ratio === 0) return "bg-brand/10";
  if (ratio <= 1 / 3) return "bg-brand/35";
  if (ratio <= 2 / 3) return "bg-brand/60 text-primary-foreground";
  if (ratio < 1) return "bg-brand/80 text-primary-foreground";
  return "bg-brand text-primary-foreground";
}

function SunanHistory({
  tracked,
  stats,
  today,
  selected,
  onSelect,
  onToggle,
}: {
  tracked: TrackedSunnah[];
  stats: Stats;
  today: Date;
  selected: string;
  onSelect: (day: string) => void;
  onToggle: (day: string, id: string) => void;
}) {
  const t = useTranslations("sunan");
  const locale = useLocale();
  const d = (n: number) => toLocaleDigits(n, locale);
  const todayKey = dayKey(today);
  const days = Array.from({ length: 30 }, (_, i) => dayKey(addDays(today, i - 29)));
  const items = [
    { icon: Landmark, value: stats.fullDaysThisMonth, label: t("fullDays") },
    { icon: Flame, value: stats.bestStreak, label: t("bestStreak") },
    { icon: Moon, value: stats.countThisMonth("witr"), label: t("witrNights") },
    { icon: Sun, value: stats.countThisMonth("duha"), label: t("duhaDays") },
  ];
  const selDate = parseDay(selected);
  const selDone = stats.doneOn(selected);
  const isToday = selected === todayKey;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <section className="rounded-2xl border bg-card p-5">
          <h3 className="text-center text-sm font-bold text-muted-foreground">{t("thisMonth")}</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center text-center">
                <Icon className="size-5 text-brand" />
                <span className="mt-1 text-xl font-bold tabular-nums">{d(value)}</span>
                <span className="text-xs leading-snug text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h3 className="mb-3 font-bold text-brand">{t("last30")}</h3>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const witr = stats.doneOn(day).includes("witr");
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onSelect(day)}
                  aria-pressed={day === selected}
                  title={day}
                  className={cn(
                    "relative grid aspect-square place-items-center rounded-lg text-xs font-bold tabular-nums transition",
                    shade(stats.rakaatOn(day) / stats.totalRakaat),
                    day === selected
                      ? "ring-2 ring-gold"
                      : day === todayKey && "ring-1 ring-brand",
                  )}
                >
                  {d(parseDay(day).getDate())}
                  {witr && (
                    <span className="absolute end-1 top-1 size-1.5 rounded-full bg-current" aria-label={t("witrMark")} />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            {t("less")}
            {[0, 0.34, 0.67, 1].map((r) => (
              <span key={r} className={cn("size-3.5 rounded", shade(r))} />
            ))}
            {t("more")}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-bold">
            {isToday && t("todayPrefix")}
            {selDate.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h3>
          <span className="text-sm font-bold text-brand tabular-nums">
            {t("dayRakaat", { done: d(stats.rakaatOn(selected)), total: d(stats.totalRakaat) })}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{isToday ? t("editToday") : t("editPast")}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {tracked.map((s) => {
            const on = selDone.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onToggle(selected, s.id)}
                aria-pressed={on}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-start text-sm transition hover:border-brand/50",
                  on && "border-brand bg-secondary font-bold",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-md border",
                    on && "border-brand bg-brand text-primary-foreground",
                  )}
                >
                  {on && <Check className="size-3.5" />}
                </span>
                {t(`tracked.${s.id}`)}
                {s.rakaat > 0 && (
                  <span className="ms-auto text-xs text-muted-foreground">({d(s.rakaat)})</span>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
