"use client";

import { ArrowLeftRight, CalendarDays, ChevronLeft, ChevronRight, Hourglass, PartyPopper, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNow } from "@/hooks/use-location";
import {
  addDays,
  dayKey,
  daysBetween,
  daysInHijriMonth,
  formatGregorian,
  formatHijri,
  fromHijri,
  gregorianAge,
  hijriAge,
  hijriMonthName,
  ISLAMIC_EVENTS,
  keyToDate,
  nextOccurrence,
  toHijri,
  upcomingEvents,
} from "@/lib/data/hijri";
import { cn } from "@/lib/utils";

const TABS = ["calendar", "converter", "age", "events"] as const;
type Tab = (typeof TABS)[number];

export function HijriTools() {
  const t = useTranslations("hijri");
  const locale = useLocale();
  const now = useNow(60_000);
  const today = now ? dayKey(now) : null;
  const [tab, setTab] = useState<Tab>("calendar");
  const events = useMemo(() => (today ? upcomingEvents(today) : []), [today]);
  const next = events[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="hero-gradient rounded-2xl p-5 text-white">
          <p className="flex items-center gap-2 text-sm text-white/70">
            <CalendarDays className="size-4 text-gold" />
            {t("today")}
          </p>
          <p className="mt-2 text-3xl font-bold text-gold">{today ? formatHijri(today, locale) : " "}</p>
          <p className="mt-1 text-white/85">{today ? formatGregorian(today, locale, { dateStyle: "full" }) : " "}</p>
          <p className="mt-3 text-xs text-white/60">{t("note")}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-gold" />
            {t("nextOccasion")}
          </p>
          {next && (
            <>
              <p className="mt-2 text-2xl font-bold">{t(`events.${next.id}.name`)}</p>
              <p className="text-4xl font-bold text-brand">{t("countdown", { count: next.daysUntil, n: toLocaleDigits(next.daysUntil, locale) })}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatHijri(next.date, locale)} · {formatGregorian(next.date, locale)}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm transition hover:border-brand/50",
              tab === id && "border-transparent bg-primary text-primary-foreground",
            )}
          >
            {t(`tabs.${id}`)}
          </button>
        ))}
      </div>

      {today && tab === "calendar" && <MonthCalendar today={today} />}
      {today && tab === "converter" && <Converter today={today} />}
      {today && tab === "age" && <AgeTool today={today} />}
      {today && tab === "events" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <div key={e.id} className={cn("rounded-2xl border bg-card p-5", e.daysUntil === 0 && "border-brand")}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold">{t(`events.${e.id}.name`)}</p>
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-brand">
                  {t("countdown", { count: e.daysUntil, n: toLocaleDigits(e.daysUntil, locale) })}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(`events.${e.id}.desc`)}</p>
              <p className="mt-3 text-sm text-gold">{formatHijri(e.date, locale)}</p>
              <p className="text-xs text-muted-foreground">{formatGregorian(e.date, locale, { dateStyle: "full" })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MonthCalendar({ today }: { today: string }) {
  const t = useTranslations("hijri");
  const locale = useLocale();
  const n = (x: number) => toLocaleDigits(x, locale);
  const th = toHijri(today);
  const [ym, setYm] = useState({ year: th.year, month: th.month });
  const shift = (d: number) =>
    setYm(({ year, month }) => {
      const idx = year * 12 + month - 1 + d;
      return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
    });
  const start = fromHijri(ym.year, ym.month, 1);
  const len = daysInHijriMonth(ym.year, ym.month);
  const lead = keyToDate(start).getUTCDay();
  const eventDays = new Map<number, string>(
    ISLAMIC_EVENTS.filter((e) => e.month === ym.month).map((e) => [e.day, e.id] as [number, string]),
  );
  const end = addDays(start, len - 1);
  const Prev = locale === "ar" ? ChevronRight : ChevronLeft;
  const Next = locale === "ar" ? ChevronLeft : ChevronRight;
  const monthEvents = ISLAMIC_EVENTS.filter((e) => e.month === ym.month);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <section className="rounded-2xl border bg-card p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => shift(-1)} aria-label={t("prevMonth")}>
            <Prev />
          </Button>
          <div className="flex-1 text-center">
            <p className="text-lg font-bold">
              {hijriMonthName(ym.month, locale)} {n(ym.year)} {locale === "ar" ? "هـ" : "AH"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatGregorian(start, locale, { month: "short", day: "numeric" })} – {formatGregorian(end, locale, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => shift(1)} aria-label={t("nextMonth")}>
            <Next />
          </Button>
        </div>
        {(ym.year !== th.year || ym.month !== th.month) && (
          <div className="mb-2 text-center">
            <Button variant="outline" size="sm" onClick={() => setYm({ year: th.year, month: th.month })}>
              {t("backToday")}
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
          {Array.from({ length: len }, (_, i) => {
            const key = addDays(start, i);
            const g = keyToDate(key);
            const ev = eventDays.get(i + 1);
            return (
              <div
                key={key}
                title={ev ? t(`events.${ev}.name`) : undefined}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm",
                  ev && "border-gold bg-gold/10",
                  key === today && "border-transparent bg-primary text-primary-foreground",
                )}
              >
                <span className="text-base font-bold tabular-nums">{n(i + 1)}</span>
                <span className="text-[10px] leading-none opacity-70">
                  {n(g.getUTCDate())}
                  {(i === 0 || g.getUTCDate() === 1) && ` ${formatGregorian(key, locale, { month: "short" })}`}
                </span>
                {ev && <span className="absolute top-1 size-1.5 rounded-full bg-gold" />}
              </div>
            );
          })}
        </div>
      </section>
      <aside className="space-y-3">
        {monthEvents.map((e) => {
          const key = fromHijri(ym.year, e.month, e.day);
          return (
            <div key={e.id} className="rounded-2xl border bg-card p-4">
              <p className="font-bold">{t(`events.${e.id}.name`)}</p>
              <p className="text-sm text-muted-foreground">{t(`events.${e.id}.desc`)}</p>
              <p className="mt-2 text-xs text-gold">
                {formatHijri(key, locale)} · {formatGregorian(key, locale)}
              </p>
            </div>
          );
        })}
      </aside>
    </div>
  );
}

function Converter({ today }: { today: string }) {
  const t = useTranslations("hijri");
  const locale = useLocale();
  const th = toHijri(today);
  const [g, setG] = useState(today);
  const [h, setH] = useState({ day: String(th.day), month: th.month, year: String(th.year) });

  const hYear = Number(h.year);
  const hDay = Number(h.day);
  const hValid = Number.isInteger(hYear) && hYear >= 1343 && hYear <= 1500 && Number.isInteger(hDay) && hDay >= 1 && hDay <= 30;
  const hResult = hValid ? fromHijri(hYear, h.month, Math.min(hDay, daysInHijriMonth(hYear, h.month))) : null;
  const gValid = /^\d{4}-\d{2}-\d{2}$/.test(g) && g >= "1924-08-01" && g <= "2076-11-16";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <ArrowLeftRight className="size-5 text-brand" />
          {t("converter.g2h")}
        </h2>
        <label className="block space-y-1.5">
          <span className="text-sm">{t("gregorianDate")}</span>
          <Input type="date" value={g} onChange={(e) => setG(e.target.value)} />
        </label>
        <div className="mt-4 rounded-xl bg-secondary p-4">
          <p className="text-xs text-muted-foreground">{t("converter.result")}</p>
          <p className="text-xl font-bold text-brand">{gValid ? formatHijri(g, locale) : t("converter.invalid")}</p>
          {gValid && <p className="text-sm text-muted-foreground">{formatGregorian(g, locale, { weekday: "long" })}</p>}
        </div>
      </section>
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <ArrowLeftRight className="size-5 text-brand" />
          {t("converter.h2g")}
        </h2>
        <div className="grid grid-cols-[4.5rem_1fr_5.5rem] gap-2">
          <label className="space-y-1.5">
            <span className="text-sm">{t("converter.day")}</span>
            <Input inputMode="numeric" value={h.day} onChange={(e) => setH({ ...h, day: e.target.value })} />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm">{t("converter.month")}</span>
            <select
              className="h-8 w-full rounded-lg border bg-transparent px-2 text-sm dark:bg-input/30"
              value={h.month}
              onChange={(e) => setH({ ...h, month: Number(e.target.value) })}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1} className="bg-popover">
                  {hijriMonthName(i + 1, locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm">{t("converter.year")}</span>
            <Input inputMode="numeric" value={h.year} onChange={(e) => setH({ ...h, year: e.target.value })} />
          </label>
        </div>
        <div className="mt-4 rounded-xl bg-secondary p-4">
          <p className="text-xs text-muted-foreground">{t("converter.result")}</p>
          <p className="text-xl font-bold text-brand">{hResult ? formatGregorian(hResult, locale, { dateStyle: "long" }) : t("converter.invalid")}</p>
          {hResult && <p className="text-sm text-muted-foreground">{formatGregorian(hResult, locale, { weekday: "long" })}</p>}
        </div>
      </section>
    </div>
  );
}

function AgeTool({ today }: { today: string }) {
  const t = useTranslations("hijri");
  const locale = useLocale();
  const n = (x: number) => toLocaleDigits(x, locale);
  const [birth, setBirth] = useState("");
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(birth) && birth <= today && birth >= "1924-08-01";
  const span = (s: { years: number; months: number; days: number }) =>
    t("age.span", { years: n(s.years), months: n(s.months), days: n(s.days) });
  const bh = valid ? toHijri(birth) : null;
  const nextBirthday = bh ? nextOccurrence(bh.month, bh.day, today) : null;

  return (
    <section className="grid gap-4 md:grid-cols-[20rem_1fr]">
      <div className="h-fit rounded-2xl border bg-card p-5">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("age.birth")}</span>
          <Input type="date" max={today} value={birth} onChange={(e) => setBirth(e.target.value)} />
        </label>
        {!valid && <p className="mt-3 text-sm text-muted-foreground">{t("age.empty")}</p>}
      </div>
      {valid && nextBirthday && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="hero-gradient rounded-2xl p-5 text-white">
            <p className="flex items-center gap-2 text-sm text-white/70">
              <Hourglass className="size-4 text-gold" />
              {t("age.hijriAge")}
            </p>
            <p className="mt-2 text-xl font-bold text-gold">{span(hijriAge(birth, today))}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{t("age.gregorianAge")}</p>
            <p className="mt-2 text-xl font-bold text-brand">{span(gregorianAge(birth, today))}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{t("age.hijriBirth")}</p>
            <p className="mt-2 text-xl font-bold">{formatHijri(birth, locale)}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <PartyPopper className="size-4 text-gold" />
              {t("age.nextBirthday")}
            </p>
            <p className="mt-2 text-xl font-bold">{formatGregorian(nextBirthday, locale)}</p>
            <p className="text-sm text-brand">{t("countdown", { count: daysBetween(today, nextBirthday), n: n(daysBetween(today, nextBirthday)) })}</p>
          </div>
        </div>
      )}
    </section>
  );
}
