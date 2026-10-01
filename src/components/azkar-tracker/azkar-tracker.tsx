"use client";

import {
  AlarmClock,
  BedDouble,
  BookOpen,
  Check,
  Flame,
  Sun,
  Sunset,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import {
  addDays,
  bestStreak,
  currentStreak,
  dayKey,
  fmtDate,
  fmtHijri,
  startOfDay,
} from "@/components/prayer-tracker/dates";
import { Link } from "@/i18n/navigation";
import { useNow } from "@/hooks/use-location";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import {
  AZKAR_LOG_KEY,
  CORE,
  isCompleteDay,
  TRACKED,
  type AzkarLog,
  type TrackedId,
} from "./storage";

const ICONS: Record<TrackedId, LucideIcon> = {
  morning: Sun,
  evening: Sunset,
  "after-prayer": BookOpen,
  sleep: BedDouble,
  waking: AlarmClock,
};

/** Port of AzkarTrackerScreen: daily checklist, streak, month completion and history. */
export function AzkarTracker({
  titles,
  counts,
}: {
  titles: Record<string, string>;
  counts: Record<string, number>;
}) {
  const t = useTranslations("azkar-tracker");
  const locale = useLocale();
  const now = useNow(60_000);
  const [log, setLog] = useLocalStorage<AzkarLog>(AZKAR_LOG_KEY, {});
  const [selected, setSelected] = useState<string | null>(null);
  const n = (v: number) => toLocaleDigits(v, locale);

  const today = now ? startOfDay(now) : null;
  const todayKey = today ? dayKey(today) : "";
  const selKey = selected ?? todayKey;
  const day = log[selKey] ?? {};
  const selDate = selKey ? new Date(`${selKey}T12:00:00`) : null;

  const toggle = (id: TrackedId) =>
    selKey &&
    setLog((l) => {
      const d = { ...l[selKey] };
      if (d[id]) delete d[id];
      else d[id] = true;
      const out = { ...l, [selKey]: d };
      if (!Object.keys(d).length) delete out[selKey];
      return out;
    });

  const streak = today ? currentStreak((k) => isCompleteDay(log[k]), today) : 0;
  const best = bestStreak(
    Object.keys(log).filter((k) => isCompleteDay(log[k])),
  );
  const monthRead = today
    ? Object.entries(log)
        .filter(([k]) => k.startsWith(todayKey.slice(0, 8)))
        .reduce((s, [, d]) => s + CORE.filter((c) => d[c]).length, 0)
    : 0;
  const monthPct = today
    ? Math.min(
        100,
        Math.round((monthRead / (CORE.length * today.getDate())) * 100),
      )
    : 0;
  const history = today
    ? Array.from({ length: 28 }, (_, i) => addDays(today, i - 27))
    : [];
  const doneToday = TRACKED.filter((c) => day[c.id]).length;

  return (
    <div className="space-y-6">
      <section className="hero-gradient rounded-2xl p-5 text-white shadow-xl shadow-primary/30 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/70" suppressHydrationWarning>
              {selDate ? fmtHijri(selDate, locale) : " "}
            </p>
            <p className="mt-1 text-2xl font-bold" suppressHydrationWarning>
              {selDate
                ? fmtDate(selDate, locale, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                : " "}
            </p>
            <p className="mt-1 text-sm text-gold">
              {t("dayProgress", {
                done: n(doneToday),
                total: n(TRACKED.length),
              })}
            </p>
          </div>
          <div className="flex gap-3">
            {[
              [Flame, streak, t("streak")],
              [null, `${n(monthPct)}٪`, t("monthCompletion")],
              [Trophy, best, t("bestStreak")],
            ].map(([Icon, value, label], i) => {
              const I = Icon as LucideIcon | null;
              return (
                <div
                  key={i}
                  className="rounded-xl bg-white/10 px-3 py-2 text-center sm:px-4"
                >
                  <p className="flex items-center justify-center gap-1 text-2xl font-bold text-gold">
                    {I && <I className="size-5" />}{" "}
                    {typeof value === "number" ? n(value) : (value as string)}
                  </p>
                  <p className="text-xs text-white/70">{label as string}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {today &&
            Array.from({ length: 14 }, (_, i) => addDays(today, -i)).map(
              (d) => {
                const k = dayKey(d);
                const active = k === selKey;
                const complete = isCompleteDay(log[k]);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSelected(k)}
                    className={cn(
                      "flex w-14 shrink-0 flex-col items-center gap-1 rounded-xl border border-white/10 py-2 transition",
                      active
                        ? "border-gold bg-gold text-primary"
                        : "bg-white/5 hover:bg-white/10",
                    )}
                  >
                    <span className="text-[11px] opacity-80">
                      {fmtDate(d, locale, { weekday: "short" })}
                    </span>
                    <span className="text-lg font-bold">{n(d.getDate())}</span>
                    <span className="h-3">
                      {complete && <Check className="size-3" />}
                    </span>
                  </button>
                );
              },
            )}
        </div>
      </section>

      <section>
        <p className="mb-3 text-sm text-muted-foreground">{t("hint")}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TRACKED.map((c) => {
            const Icon = ICONS[c.id];
            const done = !!day[c.id];
            return (
              <div
                key={c.id}
                className={cn(
                  "rounded-2xl border bg-card p-4 transition",
                  done && "border-brand/50 bg-brand/5",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(c.id)}
                  disabled={!now}
                  className="flex w-full items-center gap-3 text-start"
                >
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-full transition",
                      done
                        ? "bg-brand text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? (
                      <Check className="size-5" />
                    ) : (
                      <Icon className="size-5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold" dir="rtl">
                      {locale === "ar" ? titles[c.id] : t(`categories.${c.id}`)}
                    </span>
                    <span
                      className={cn(
                        "block text-sm",
                        done ? "text-brand" : "text-muted-foreground",
                      )}
                    >
                      {done ? t("read") : t("notRead")}
                      {CORE.includes(c.id) && (
                        <span className="ms-2 rounded-full bg-gold/20 px-2 py-0.5 text-[11px] text-foreground">
                          {t("core")}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
                <Link
                  href={`/azkar/${c.azkarId}`}
                  className="mt-3 block rounded-xl bg-secondary px-3 py-2 text-center text-sm font-medium transition hover:bg-brand/15"
                >
                  {t("open", { count: n(counts[c.id] ?? 0) })}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="mb-4 font-bold">{t("history")}</h2>
        {today && (
          <div className="overflow-x-auto">
            <div className="grid w-max grid-cols-[auto_repeat(28,1.25rem)] items-center gap-1">
              <span />
              {history.map((d) => (
                <span
                  key={dayKey(d)}
                  className="text-center text-[10px] text-muted-foreground"
                >
                  {d.getDate() === 1 || d === history[0] || d.getDay() === 6
                    ? n(d.getDate())
                    : ""}
                </span>
              ))}
              {TRACKED.map((c) => (
                <div key={c.id} className="contents">
                  <span className="pe-2 text-xs font-medium whitespace-nowrap">
                    {t(`short.${c.id}`)}
                  </span>
                  {history.map((d) => {
                    const k = dayKey(d);
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setSelected(k)}
                        title={fmtDate(d, locale, {
                          day: "numeric",
                          month: "short",
                        })}
                        className={cn(
                          "size-5 rounded",
                          log[k]?.[c.id] ? "bg-brand" : "bg-muted",
                          k === selKey && "ring-2 ring-gold",
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
