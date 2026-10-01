"use client";

import { CalendarClock, ChevronLeft, ChevronRight, Minus, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useNow } from "@/hooks/use-location";
import {
  FAST_TYPES,
  isForbiddenFastingDay,
  LOG_KEY,
  QADA_KEY,
  suggestedFastType,
  upcomingFastingOccasions,
  type FastLog,
  type FastType,
} from "@/lib/data/fasting-tracker";
import { addDays, dayKey, formatGregorian, hijriMonthName, keyToDate, toHijri } from "@/lib/data/hijri";
import { cn } from "@/lib/utils";

/** Accent per type, using theme tokens only. */
const TYPE_CLASS: Record<FastType, string> = {
  ramadan: "bg-primary text-primary-foreground",
  missed: "bg-destructive/15 text-destructive line-through",
  monday_thursday: "bg-brand/20 text-brand",
  white_days: "bg-gold/25 text-foreground",
  ashura: "bg-chart-4/30 text-foreground",
  arafah: "bg-chart-5/30 text-foreground",
  shawwal_six: "bg-chart-2/30 text-foreground",
  qada: "bg-destructive/20 text-foreground",
  voluntary: "bg-muted-foreground/20 text-foreground",
};
const DOT_CLASS: Record<FastType, string> = {
  ramadan: "bg-primary",
  missed: "bg-destructive",
  monday_thursday: "bg-brand",
  white_days: "bg-gold",
  ashura: "bg-chart-4",
  arafah: "bg-chart-5",
  shawwal_six: "bg-chart-2",
  qada: "bg-destructive/60",
  voluntary: "bg-muted-foreground",
};

export function FastingTracker() {
  const t = useTranslations("fasting-tracker");
  const locale = useLocale();
  const n = (x: number) => toLocaleDigits(x, locale);
  const now = useNow(60_000);
  const today = now ? dayKey(now) : null;
  const [log, setLog] = useLocalStorage<FastLog>(LOG_KEY, {});
  const [qada, setQada] = useLocalStorage<number>(QADA_KEY, 0);
  const [offset, setOffset] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  // First day of the displayed Gregorian month.
  const monthStart = useMemo(() => {
    if (!today) return null;
    const [y, m] = today.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + offset, 1, 12));
    return d.toISOString().slice(0, 10);
  }, [today, offset]);

  const mark = (key: string, type: FastType | null) => {
    const prev = log[key] ?? null;
    // Qada counter bookkeeping (FastingTrackerCubit.markFast / unmark), plus
    // web-only "missed" Ramadan days that add a day to make up.
    let delta = 0;
    if (prev === "qada" && type !== "qada") delta += 1;
    if (type === "qada" && prev !== "qada") delta -= 1;
    if (prev === "missed" && type !== "missed") delta -= 1;
    if (type === "missed" && prev !== "missed") delta += 1;
    setLog((l) => {
      const next = { ...l };
      if (type) next[key] = type;
      else delete next[key];
      return next;
    });
    if (delta) setQada((q) => Math.max(0, q + delta));
    setPicked(null);
  };

  const stats = useMemo(() => {
    if (!today) return null;
    const h = toHijri(today);
    let month = 0;
    let year = 0;
    const byType: Partial<Record<FastType, number>> = {};
    for (const [key, type] of Object.entries(log)) {
      if (type === "missed") continue;
      const hk = toHijri(key);
      if (hk.year !== h.year) continue;
      year++;
      byType[type] = (byType[type] ?? 0) + 1;
      if (hk.month === h.month) month++;
    }
    return { h, month, year, byType };
  }, [log, today]);

  const occasions = useMemo(() => (today ? upcomingFastingOccasions(today) : []), [today]);

  if (!today || !monthStart || !stats) return <div className="h-96 rounded-2xl border bg-card" />;

  const ms = keyToDate(monthStart);
  const daysInMonth = new Date(Date.UTC(ms.getUTCFullYear(), ms.getUTCMonth() + 1, 0)).getUTCDate();
  const lead = (ms.getUTCDay() + 1) % 7; // Saturday-first grid
  const firstH = toHijri(monthStart);
  const lastH = toHijri(addDays(monthStart, daysInMonth - 1));
  const hijriRange =
    firstH.month === lastH.month
      ? `${hijriMonthName(firstH.month, locale)} ${n(firstH.year)}`
      : `${hijriMonthName(firstH.month, locale)} – ${hijriMonthName(lastH.month, locale)} ${n(lastH.year)}`;
  const Prev = locale === "ar" ? ChevronRight : ChevronLeft;
  const Next = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        <section className="rounded-2xl border bg-card p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setOffset((o) => o - 1)} aria-label={t("prevMonth")}>
              <Prev />
            </Button>
            <div className="flex-1 text-center">
              <p className="font-bold">{formatGregorian(monthStart, locale, { month: "long", year: "numeric" })}</p>
              <p className="text-xs text-muted-foreground">{hijriRange} {locale === "ar" ? "هـ" : "AH"}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOffset((o) => o + 1)} aria-label={t("nextMonth")}>
              <Next />
            </Button>
          </div>
          {offset !== 0 && (
            <div className="mb-2 text-center">
              <Button variant="outline" size="sm" onClick={() => setOffset(0)}>
                {t("today")}
              </Button>
            </div>
          )}
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {(t.raw("weekdays") as string[]).map((w) => (
              <span key={w} className="py-1">{w}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: lead }, (_, i) => <span key={`l${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const key = addDays(monthStart, i);
              const type = log[key];
              const h = toHijri(key);
              const future = key > today;
              const forbidden = isForbiddenFastingDay(h);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={future}
                  onClick={() => setPicked(key)}
                  title={type ? t(`types.${type}`) : undefined}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition enabled:hover:border-brand/50 disabled:opacity-40",
                    h.month === 9 && !type && "border-brand/40",
                    forbidden && !type && "border-dashed border-destructive/50",
                    type && cn("border-transparent", TYPE_CLASS[type]),
                    key === today && "ring-2 ring-gold",
                  )}
                >
                  <span className="font-bold tabular-nums">{n(i + 1)}</span>
                  <span className="text-[10px] leading-none opacity-70">{n(h.day)}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t("calendarHint")}</p>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {FAST_TYPES.map((ft) => (
              <span key={ft} className="flex items-center gap-1">
                <span className={cn("size-2.5 rounded-full", DOT_CLASS[ft])} />
                {t(`types.${ft}`)}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-bold">{t("stats.title")}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-xs text-muted-foreground">{t("stats.month", { month: hijriMonthName(stats.h.month, locale) })}</p>
              <p className="text-xl font-bold text-brand">{t("stats.days", { count: stats.month, n: n(stats.month) })}</p>
            </div>
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-xs text-muted-foreground">{t("stats.year", { year: n(stats.h.year) })}</p>
              <p className="text-xl font-bold text-brand">{t("stats.days", { count: stats.year, n: n(stats.year) })}</p>
            </div>
          </div>
          <p className="mt-4 mb-2 text-sm font-medium">{t("stats.byType")}</p>
          {stats.year === 0 ? (
            <p className="text-sm text-muted-foreground">{t("stats.empty")}</p>
          ) : (
            <div className="space-y-2">
              {FAST_TYPES.filter((ft) => stats.byType[ft]).map((ft) => (
                <div key={ft} className="flex items-center gap-2 text-sm">
                  <span className={cn("size-2.5 rounded-full", DOT_CLASS[ft])} />
                  <span className="w-32 shrink-0">{t(`types.${ft}`)}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <span className={cn("block h-full rounded-full", DOT_CLASS[ft])} style={{ width: `${((stats.byType[ft] ?? 0) / stats.year) * 100}%` }} />
                  </span>
                  <span className="w-8 text-end tabular-nums">{n(stats.byType[ft] ?? 0)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-4">
        <div className="hero-gradient rounded-2xl p-5 text-white">
          <p className="text-sm text-white/70">{t("qada.title")}</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <Button size="icon" variant="secondary" onClick={() => setQada((q) => Math.max(0, q - 1))} aria-label={t("qada.remove")}>
              <Minus />
            </Button>
            <span className="text-5xl font-bold text-gold tabular-nums">{n(qada)}</span>
            <Button size="icon" variant="secondary" onClick={() => setQada((q) => q + 1)} aria-label={t("qada.add")}>
              <Plus />
            </Button>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/75">{t("qada.hint")}</p>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <CalendarClock className="size-5 text-brand" />
            {t("upcoming.title")}
          </h2>
          <ul className="space-y-2">
            {occasions.map((o) => (
              <li key={o.id} className="flex items-center gap-3 rounded-xl bg-secondary p-3">
                <span className={cn("size-2.5 shrink-0 rounded-full", DOT_CLASS[o.type])} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{t(`upcoming.${o.id}`)}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.id === "monday" || o.id === "thursday"
                      ? t("upcoming.weekly")
                      : `${o.id === "whiteDays" ? `${n(13)}–${n(15)}` : n(o.hijri.day)} ${hijriMonthName(o.hijri.month, locale)} ${n(o.hijri.year)}`}
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-xs font-bold text-brand">{t("upcoming.away", { count: o.daysAway, n: n(o.daysAway) })}</p>
                  <p className="text-[11px] text-muted-foreground">{formatGregorian(o.date, locale, { day: "numeric", month: "short" })}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">{t("upcoming.note")}</p>
        </div>
      </aside>

      <Dialog open={picked != null} onOpenChange={(o) => !o && setPicked(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          {picked && <TypePicker dayKey={picked} current={log[picked]} onPick={(ty) => mark(picked, ty)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TypePicker({ dayKey: key, current, onPick }: { dayKey: string; current?: FastType; onPick: (t: FastType | null) => void }) {
  const t = useTranslations("fasting-tracker");
  const locale = useLocale();
  const n = (x: number) => toLocaleDigits(x, locale);
  const h = toHijri(key);
  const forbidden = isForbiddenFastingDay(h);
  const ramadan = h.month === 9;
  const suggested = suggestedFastType(key);
  // Ramadan days log the obligatory fast (or a missed day); other days use the app's types.
  const options: FastType[] = ramadan ? ["ramadan", "missed"] : FAST_TYPES.filter((x) => x !== "ramadan" && x !== "missed");

  return (
    <div className="space-y-3">
      <DialogTitle className="text-center text-lg font-bold text-brand">{current ? t("sheet.edit") : t("sheet.log")}</DialogTitle>
      <p className="text-center text-sm text-muted-foreground">
        {formatGregorian(key, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {n(h.day)} {hijriMonthName(h.month, locale)} {n(h.year)}
      </p>
      {forbidden && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{t("sheet.forbidden")}</p>}
      {ramadan && <p className="rounded-xl bg-secondary p-3 text-sm">{t("sheet.ramadan")}</p>}
      <div className="space-y-2">
        {options.map((ft) => (
          <button
            key={ft}
            type="button"
            onClick={() => onPick(ft)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border p-3 text-start text-sm transition hover:border-brand/50",
              ft === suggested && "bg-secondary",
              ft === current && "border-brand font-bold",
            )}
          >
            <span className={cn("size-3 rounded-full", DOT_CLASS[ft])} />
            <span className="flex-1">{t(`types.${ft}`)}</span>
            {ft === suggested && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs">{t("sheet.suggested")}</span>}
          </button>
        ))}
      </div>
      {current && (
        <Button variant="ghost" className="w-full text-destructive" onClick={() => onPick(null)}>
          <Trash2 />
          {t("sheet.remove")}
        </Button>
      )}
    </div>
  );
}
