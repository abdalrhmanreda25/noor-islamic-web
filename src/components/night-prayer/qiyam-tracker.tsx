"use client";

import { Minus, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toLocaleDigits } from "@/components/page-header";
import { addDays, dayKey, fmtDate } from "@/components/prayer-tracker/dates";
import { useNow } from "@/hooks/use-location";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";

/** Rak'ahs prayed per night, keyed by the date the night began (its evening). */
export type QiyamLog = Record<string, number>;
export const QIYAM_LOG_KEY = "yusr.night-prayer.log";

const QUICK = [2, 4, 6, 8, 11];

/** Port of QiyamTrackerCard: log tonight's rak'ahs, streak, month stats, last 7 nights. */
export function QiyamTracker() {
  const t = useTranslations("night-prayer");
  const locale = useLocale();
  const now = useNow(60_000);
  const [log, setLog] = useLocalStorage<QiyamLog>(QIYAM_LOG_KEY, {});
  const n = (v: number) => toLocaleDigits(v, locale);

  // Before noon the night being logged is the one that just ended.
  const base = now ?? new Date(0);
  const lastNight = base.getHours() < 12;
  const tonight = addDays(base, lastNight ? -1 : 0);
  const key = dayKey(tonight);
  const rakaat = log[key] ?? 0;

  const set = (v: number) =>
    setLog((l) => {
      const next = { ...l };
      if (v > 0) next[key] = v;
      else delete next[key];
      return next;
    });

  let streak = 0;
  for (let d = log[key] ? tonight : addDays(tonight, -1); log[dayKey(d)]; d = addDays(d, -1)) streak++;
  const monthPrefix = key.slice(0, 8);
  const monthEntries = Object.entries(log).filter(([k]) => k.startsWith(monthPrefix));
  const week = Array.from({ length: 7 }, (_, i) => addDays(tonight, i - 6));

  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-brand">{lastNight ? t("trackerLastNight") : t("trackerTonight")}</h2>
          <p className="text-sm text-muted-foreground">{rakaat ? t("accepted") : t("trackerHint")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => set(rakaat - 1)}
            disabled={!now || rakaat === 0}
            aria-label="-"
            className="grid size-9 place-items-center rounded-full border text-brand hover:bg-muted disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <div className="w-14 text-center">
            <p className="text-2xl font-bold text-brand tabular-nums">{n(rakaat)}</p>
            <p className="text-xs text-muted-foreground">{t("rakah")}</p>
          </div>
          <button
            type="button"
            onClick={() => set(rakaat + 1)}
            disabled={!now}
            aria-label="+"
            className="grid size-9 place-items-center rounded-full border text-brand hover:bg-muted disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => set(q)}
            disabled={!now}
            className={cn(
              "min-w-11 rounded-full border px-3 py-1 text-sm font-semibold transition",
              rakaat === q ? "border-brand bg-brand text-white" : "hover:border-brand/50",
            )}
          >
            {n(q)}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          [streak, t("statStreak")],
          [monthEntries.length, t("statNights")],
          [monthEntries.reduce((s, [, v]) => s + v, 0), t("statRakaat")],
        ].map(([value, label]) => (
          <div key={label} className="rounded-xl bg-secondary p-3 text-center">
            <p className="text-xl font-bold text-brand tabular-nums">{n(value as number)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {week.map((d) => {
          const k = dayKey(d);
          const v = log[k];
          const isTonight = k === key;
          return (
            <div key={k} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "grid size-9 place-items-center rounded-full border text-sm font-bold tabular-nums",
                  v ? "border-brand bg-brand text-white" : "text-muted-foreground",
                  isTonight && !v && "border-gold",
                )}
              >
                {v ? n(v) : ""}
              </div>
              <span className={cn("text-[11px] text-muted-foreground", isTonight && "font-bold text-gold")} suppressHydrationWarning>
                {isTonight ? (lastNight ? t("lastNight") : t("tonightShort")) : now ? fmtDate(d, locale, { weekday: "short" }) : ""}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
