"use client";

import { Check, Clock, Flame, History, Quote, User, Users, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNow } from "@/hooks/use-location";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import { addDays, currentStreak, dayKey, fmtDate, fmtHijri, startOfDay } from "./dates";
import { QadaCounters } from "./qada-counters";
import {
  isFullDay,
  PRAYER_KEYS,
  PRAYER_LOG_KEY,
  prayedCount,
  QADA_KEY,
  STATE_STYLE,
  STATES,
  type PrayerKey,
  type PrayerLog,
  type QadaCounts,
  type State,
} from "./storage";
import { MonthView, WeekView } from "./tracker-stats";

export const STATE_ICON = { jamaah: Users, alone: User, qada: History, missed: X } as const;

/** Port of PrayerTrackerScreen: log the five prayers per day, with streaks, stats and qada counters. */
export function PrayerTracker() {
  const t = useTranslations("prayer-tracker");
  const tp = useTranslations("prayer");
  const locale = useLocale();
  const now = useNow(60_000);
  const [log, setLog] = useLocalStorage<PrayerLog>(PRAYER_LOG_KEY, {});
  const [qada, setQada] = useLocalStorage<QadaCounts>(QADA_KEY, {});
  const [selected, setSelected] = useState<string | null>(null);
  const [deductFor, setDeductFor] = useState<PrayerKey | null>(null);
  const n = (v: number) => toLocaleDigits(v, locale);

  const today = now ? startOfDay(now) : null;
  const todayKey = today ? dayKey(today) : "";
  const selKey = selected ?? todayKey;
  const day = log[selKey] ?? {};

  const setStatus = (p: PrayerKey, s: State) => {
    if (!selKey) return;
    const next = day[p] === s ? undefined : s;
    setLog((l) => {
      const d = { ...l[selKey] };
      if (next) d[p] = next;
      else delete d[p];
      const out = { ...l, [selKey]: d };
      if (!Object.keys(d).length) delete out[selKey];
      return out;
    });
    setDeductFor(next === "qada" && (qada[p] ?? 0) > 0 ? p : null);
  };

  const streak = today ? currentStreak((k) => isFullDay(log[k]), today) : 0;
  const monthPrayed = today
    ? Object.entries(log)
        .filter(([k]) => k.startsWith(todayKey.slice(0, 8)))
        .reduce((s, [, d]) => s + prayedCount(d), 0)
    : 0;
  const monthPct = today ? Math.min(100, Math.round((monthPrayed / (5 * today.getDate())) * 100)) : 0;
  const selDate = selKey ? new Date(`${selKey}T12:00:00`) : null;
  const dayDone = prayedCount(day);

  return (
    <div className="space-y-6">
      <section className="hero-gradient rounded-2xl p-5 text-white shadow-xl shadow-primary/30 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/70" suppressHydrationWarning>
              {selDate ? fmtHijri(selDate, locale) : " "}
            </p>
            <p className="mt-1 text-2xl font-bold" suppressHydrationWarning>
              {selDate ? fmtDate(selDate, locale, { weekday: "long", day: "numeric", month: "long" }) : " "}
            </p>
            <p className="mt-1 text-sm text-gold">
              {t("dayProgress", { done: n(dayDone), total: n(5) })}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-2 text-center">
              <p className="flex items-center justify-center gap-1 text-2xl font-bold text-gold">
                <Flame className="size-5" /> {n(streak)}
              </p>
              <p className="text-xs text-white/70">{t("streak")}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2 text-center">
              <p className="text-2xl font-bold text-gold">{n(monthPct)}٪</p>
              <p className="text-xs text-white/70">{t("monthCompletion")}</p>
            </div>
          </div>
        </div>
        <DateStrip today={today} selected={selKey} onSelect={setSelected} log={log} />
      </section>

      <section>
        <p className="mb-3 text-sm text-muted-foreground">{t("hint")}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRAYER_KEYS.map((p) => {
            const s = day[p];
            const Icon = s ? STATE_ICON[s] : Clock;
            return (
              <div key={p} className={cn("rounded-2xl border bg-card p-4 transition", s && "border-brand/40")}>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-full",
                      s ? `${STATE_STYLE[s].bg} text-white` : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-lg font-bold">{tp(p)}</p>
                    <p className={cn("text-sm", s ? STATE_STYLE[s].text : "text-muted-foreground")}>
                      {t(`states.${s ?? "none"}`)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {STATES.map((st) => {
                    const SIcon = STATE_ICON[st];
                    const active = s === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        disabled={!now}
                        onClick={() => setStatus(p, st)}
                        aria-pressed={active}
                        className={cn(
                          "flex flex-col items-center gap-0.5 rounded-xl border px-1 py-2 text-[11px] font-medium transition",
                          active ? `${STATE_STYLE[st].bg} border-transparent text-white` : STATE_STYLE[st].hover,
                        )}
                      >
                        <SIcon className="size-4" />
                        {t(`states.${st}`)}
                      </button>
                    );
                  })}
                </div>
                {deductFor === p && (
                  <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-secondary p-2.5 text-sm">
                    <span>{t("deductAsk", { prayer: tp(p) })}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setQada((q) => ({ ...q, [p]: Math.max(0, (q[p] ?? 0) - 1) }));
                        setDeductFor(null);
                      }}
                      className="shrink-0 rounded-lg bg-primary px-3 py-1 text-primary-foreground"
                    >
                      {t("deduct")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div className="flex flex-col justify-center rounded-2xl border bg-card p-5">
            <p className="flex items-center gap-1.5 font-bold text-gold">
              <Quote className="size-4" /> {t("hadithTitle")}
            </p>
            <p className="mt-2 text-sm leading-loose">{t("hadith")}</p>
            <p className="mt-2 text-xs text-muted-foreground">{t("hadithSource")}</p>
          </div>
        </div>
      </section>

      <Tabs defaultValue="week">
        <TabsList>
          <TabsTrigger value="week">{t("tabs.week")}</TabsTrigger>
          <TabsTrigger value="month">{t("tabs.month")}</TabsTrigger>
          <TabsTrigger value="qada">{t("tabs.qada")}</TabsTrigger>
        </TabsList>
        <TabsContent value="week" className="mt-4">
          {today && <WeekView log={log} today={today} onSelect={setSelected} />}
        </TabsContent>
        <TabsContent value="month" className="mt-4">
          {today && <MonthView log={log} today={today} onSelect={setSelected} />}
        </TabsContent>
        <TabsContent value="qada" className="mt-4">
          <QadaCounters qada={qada} setQada={setQada} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Last 30 days, newest at the start, with a dot per prayed prayer. */
function DateStrip({
  today,
  selected,
  onSelect,
  log,
}: {
  today: Date | null;
  selected: string;
  onSelect: (k: string) => void;
  log: PrayerLog;
}) {
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const days = today ? Array.from({ length: 30 }, (_, i) => addDays(today, -i)) : [];

  useEffect(() => {
    ref.current?.querySelector("[aria-current=true]")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [selected]);

  return (
    <div className="mt-5">
      <div ref={ref} className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {days.map((d) => {
          const k = dayKey(d);
          const count = prayedCount(log[k]);
          const active = k === selected;
          return (
            <button
              key={k}
              type="button"
              aria-current={active}
              onClick={() => onSelect(k)}
              className={cn(
                "flex w-14 shrink-0 flex-col items-center gap-1 rounded-xl border border-white/10 py-2 transition",
                active ? "border-gold bg-gold text-primary" : "bg-white/5 hover:bg-white/10",
              )}
            >
              <span className="text-[11px] opacity-80">{fmtDate(d, locale, { weekday: "short" })}</span>
              <span className="text-lg font-bold">{toLocaleDigits(d.getDate(), locale)}</span>
              <span className="flex h-3 items-center">
                {count === 5 ? (
                  <Check className="size-3" />
                ) : (
                  <span className="flex gap-0.5">
                    {Array.from({ length: count }, (_, i) => (
                      <span key={i} className={cn("size-1 rounded-full", active ? "bg-primary" : "bg-gold")} />
                    ))}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
