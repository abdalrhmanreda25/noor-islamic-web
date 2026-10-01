"use client";

import { Check, LocateFixed, Moon, Printer } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useLocation, useNow } from "@/hooks/use-location";
import { addDays, dayKey, daysBetween, daysInHijriMonth, formatGregorian, fromHijri, keyToDate, toHijri } from "@/lib/data/hijri";
import { computePrayerTimes, formatDuration, formatTime } from "@/lib/prayer";
import { cn } from "@/lib/utils";

const GOALS = ["juz", "taraweeh", "sadaqah", "azkar", "dua"] as const;
const TABS = ["imsakiyah", "goals", "lastTen", "shawwal"] as const;
type Tab = (typeof TABS)[number];
/** { [hijriYear]: { [ramadanDay]: goalKey[] } }; nights 21–30 use night_taraweeh / night_qiyam. */
type GoalsStore = Record<string, Record<string, string[]>>;
/** { [hijriYear]: shawwal day indexes (1..6) } */
type ShawwalStore = Record<string, number[]>;

function useRamadanState(now: Date | null) {
  const today = now ? dayKey(now) : null;
  return useMemo(() => {
    if (!today) return null;
    const h = toHijri(today);
    const phase = h.month === 9 ? "ramadan" : h.month === 10 ? "shawwal" : "other";
    const ramadanYear = h.month <= 9 ? h.year : h.year + 1;
    const start = fromHijri(ramadanYear, 9, 1);
    return {
      today,
      hijri: h,
      phase,
      ramadanYear,
      start,
      daysInRamadan: daysInHijriMonth(ramadanYear, 9),
      ramadanDay: phase === "ramadan" ? h.day : 0,
      daysUntil: phase === "ramadan" ? 0 : daysBetween(today, start),
      shawwalYear: h.month >= 10 ? h.year : ramadanYear,
    };
  }, [today]);
}

export function RamadanView({ qadrAyah }: { qadrAyah: string }) {
  const t = useTranslations("ramadan");
  const locale = useLocale();
  const n = (x: number) => toLocaleDigits(x, locale);
  const now = useNow();
  const loc = useLocation(true);
  const s = useRamadanState(now);
  const [tab, setTab] = useState<Tab>("imsakiyah");
  const [goals, setGoals] = useLocalStorage<GoalsStore>("yusr.ramadan.goals", {});
  const [shawwal, setShawwal] = useLocalStorage<ShawwalStore>("yusr.ramadan.shawwal", {});

  const yearGoals = s ? (goals[s.ramadanYear] ?? {}) : {};
  const isDone = (day: number, goal: string) => yearGoals[day]?.includes(goal) ?? false;
  const toggleGoal = (day: number, goal: string) =>
    s &&
    setGoals((g) => {
      const y = { ...(g[s.ramadanYear] ?? {}) };
      const list = y[day] ?? [];
      y[day] = list.includes(goal) ? list.filter((x) => x !== goal) : [...list, goal];
      return { ...g, [s.ramadanYear]: y };
    });

  // Today's imsak / iftar and the countdown target (RamadanCubit.nextCountdownTarget).
  const times = now ? computePrayerTimes(loc.latitude, loc.longitude, now) : null;
  const tomorrow = now ? computePrayerTimes(loc.latitude, loc.longitude, new Date(now.getTime() + 86_400_000)) : null;
  const target =
    now && times && tomorrow
      ? now < times.times.fajr
        ? { id: "imsak", time: times.times.fajr }
        : now < times.times.maghrib
          ? { id: "iftar", time: times.times.maghrib }
          : { id: "imsakTomorrow", time: tomorrow.times.fajr }
      : null;
  const fmt = (d: Date) => (times ? formatTime(d, locale, times.timeZone) : "--:--");

  const monthDone = s
    ? Object.entries(yearGoals).reduce(
        (sum, [d, list]) => sum + (+d >= 1 && +d <= s.daysInRamadan ? list.filter((g) => (GOALS as readonly string[]).includes(g)).length : 0),
        0,
      )
    : 0;
  const monthProgress = s ? monthDone / (GOALS.length * s.daysInRamadan) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="hero-gradient rounded-2xl p-5 text-white">
          <Moon className="size-8 text-gold" />
          {s?.phase === "ramadan" ? (
            <>
              <p className="mt-3 text-2xl font-bold text-gold">{t("dayOf", { day: n(s.ramadanDay), year: n(s.ramadanYear) })}</p>
              <p className="mt-1 text-sm text-white/80">{formatGregorian(s.today, locale, { dateStyle: "full" })}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-gold" style={{ width: `${(s.ramadanDay / s.daysInRamadan) * 100}%` }} />
              </div>
              <p className="mt-2 text-sm text-white/80">{t("progress", { day: n(s.ramadanDay), total: n(s.daysInRamadan) })}</p>
            </>
          ) : s ? (
            <>
              <p className="mt-3 text-sm text-white/70">{t("untilRamadan", { year: n(s.ramadanYear) })}</p>
              <p className="mt-1 text-4xl font-bold text-gold">{t("days", { count: s.daysUntil, n: n(s.daysUntil) })}</p>
              <p className="mt-3 text-sm text-white/85">{t("expectedStart", { date: formatGregorian(s.start, locale, { dateStyle: "full" }) })}</p>
              {s.phase === "shawwal" && (
                <p className="mt-2 text-sm text-gold">{t("shawwalNow", { count: n(shawwal[s.shawwalYear]?.length ?? 0) })}</p>
              )}
            </>
          ) : (
            <div className="h-28" />
          )}
          <p className="mt-3 text-xs text-white/60">{t("sightingNote")}</p>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            {target ? t("countdown.remaining", { target: t(`countdown.targets.${target.id}`) }) : " "}
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-brand">
            {target && now ? formatDuration(target.time.getTime() - now.getTime(), locale) : "--:--:--"}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-xs text-muted-foreground">{t("countdown.imsak")}</p>
              <p className="text-xl font-bold tabular-nums">{times ? fmt(times.times.fajr) : "--:--"}</p>
            </div>
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-xs text-muted-foreground">{t("countdown.iftar")}</p>
              <p className="text-xl font-bold tabular-nums">{times ? fmt(times.times.maghrib) : "--:--"}</p>
            </div>
          </div>
          {loc.isDefault && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex-1">{t("countdown.defaultLocation")}</span>
              <Button size="sm" variant="outline" onClick={loc.request} disabled={loc.status === "locating"}>
                <LocateFixed />
                {loc.status === "locating" ? t("countdown.locating") : t("countdown.useLocation")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <DuaCard title={t("iftarDua")} text={t("iftarDuaText")} source={t("iftarDuaSource")} meaning={t("iftarDuaMeaning")} />

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

      {s && tab === "imsakiyah" && (
        <section className="rounded-2xl border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">{t("imsakiyah.title", { year: n(s.ramadanYear) })}</h2>
              <p className="text-sm text-muted-foreground">{t("imsakiyah.subtitle", { count: n(s.daysInRamadan) })}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer />
              {t("imsakiyah.print")}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="px-2 py-2 text-start font-medium">{t("imsakiyah.day")}</th>
                  <th className="px-2 py-2 text-start font-medium">{t("imsakiyah.date")}</th>
                  <th className="px-2 py-2 text-start font-medium">{t("imsakiyah.imsak")}</th>
                  <th className="px-2 py-2 text-start font-medium">{t("imsakiyah.iftar")}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: s.daysInRamadan }, (_, i) => {
                  const key = addDays(s.start, i);
                  const d = keyToDate(key);
                  const pt = computePrayerTimes(loc.latitude, loc.longitude, new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12));
                  const isToday = key === s.today;
                  return (
                    <tr key={key} className={cn("border-b last:border-0", isToday && "bg-primary text-primary-foreground")}>
                      <td className="px-2 py-2 font-bold">{n(i + 1)}</td>
                      <td className="px-2 py-2">{formatGregorian(key, locale, { weekday: "short", day: "numeric", month: "short" })}</td>
                      <td className="px-2 py-2 tabular-nums">{formatTime(pt.times.fajr, locale, pt.timeZone)}</td>
                      <td className={cn("px-2 py-2 font-bold tabular-nums", isToday ? "text-gold" : "text-brand")}>
                        {formatTime(pt.times.maghrib, locale, pt.timeZone)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs leading-6 text-muted-foreground">{t("imsakiyah.note")}</p>
        </section>
      )}

      {s && tab === "goals" && <GoalsSection s={s} isDone={isDone} toggle={toggleGoal} monthProgress={monthProgress} />}

      {s && tab === "lastTen" && (
        <section className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 text-center">
            <p dir="rtl" className="quran-text text-2xl leading-loose text-brand">﴿{qadrAyah}﴾</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("lastTen.ayahRef")}</p>
          </div>
          <DuaCard title={t("lastTen.qadrDua")} text={t("lastTen.qadrDuaText")} source={t("lastTen.qadrDuaSource")} />
          <div className="rounded-2xl border bg-card p-5">
            <p className="leading-8" dir={locale === "ar" ? "rtl" : "ltr"}>{t("lastTen.hadith")}</p>
            <p className="mt-1 text-xs text-gold">{t("lastTen.hadithSource")}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="mb-3 font-bold">{t("lastTen.plan")}</h3>
            <ol className="space-y-2 text-sm">
              {(t.raw("lastTen.planItems") as string[]).map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-brand">{n(i + 1)}</span>
                  <span className="leading-6">{item}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="font-bold">{t("lastTen.tracker")}</h3>
            {s.phase !== "ramadan" && <p className="mt-1 text-sm text-muted-foreground">{t("lastTen.onlyRamadan")}</p>}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {Array.from({ length: s.daysInRamadan - 20 }, (_, i) => i + 21).map((night) => {
                const enabled = s.phase === "ramadan" && night <= s.ramadanDay;
                return (
                  <div key={night} className="flex items-center gap-2 rounded-xl border p-3">
                    <div className="flex-1">
                      <p className="font-bold">{t("lastTen.night", { n: n(night) })}</p>
                      {night % 2 === 1 && <p className="text-xs text-gold">{t("lastTen.odd")}</p>}
                    </div>
                    {(["night_taraweeh", "night_qiyam"] as const).map((g) => (
                      <CheckChip
                        key={g}
                        label={t(`lastTen.${g === "night_taraweeh" ? "taraweeh" : "qiyam"}`)}
                        checked={isDone(night, g)}
                        disabled={!enabled}
                        onClick={() => toggleGoal(night, g)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {s && tab === "shawwal" && (
        <section className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <p className="leading-8">{t("shawwal.hadith")}</p>
            <p className="mt-1 text-xs text-gold">{t("shawwal.hadithSource")}</p>
            <p className="mt-3 text-sm text-muted-foreground">{t("shawwal.note")}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            {(() => {
              const done = shawwal[s.shawwalYear] ?? [];
              const enabled = s.phase === "shawwal";
              return (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">{t("shawwal.year", { year: n(s.shawwalYear) })}</h3>
                    <span className="text-sm text-brand">{done.length >= 6 ? t("shawwal.done") : t("shawwal.count", { done: n(done.length) })}</span>
                  </div>
                  {!enabled && <p className="mt-1 text-sm text-muted-foreground">{t("shawwal.onlyShawwal")}</p>}
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {(t.raw("shawwal.ordinals") as string[]).map((ordinal, i) => (
                      <CheckChip
                        key={i}
                        big
                        label={t("shawwal.day", { ordinal })}
                        checked={done.includes(i + 1)}
                        disabled={!enabled}
                        onClick={() =>
                          setShawwal((st) => {
                            const list = st[s.shawwalYear] ?? [];
                            return {
                              ...st,
                              [s.shawwalYear]: list.includes(i + 1) ? list.filter((x) => x !== i + 1) : [...list, i + 1],
                            };
                          })
                        }
                      />
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </section>
      )}
    </div>
  );
}

function GoalsSection({
  s,
  isDone,
  toggle,
  monthProgress,
}: {
  s: NonNullable<ReturnType<typeof useRamadanState>>;
  isDone: (day: number, goal: string) => boolean;
  toggle: (day: number, goal: string) => void;
  monthProgress: number;
}) {
  const t = useTranslations("ramadan");
  const locale = useLocale();
  const n = (x: number) => toLocaleDigits(x, locale);
  const [day, setDay] = useState(Math.max(1, s.ramadanDay));
  const enabled = s.phase === "ramadan" && day <= s.ramadanDay;
  const doneFor = (d: number) => GOALS.filter((g) => isDone(d, g)).length;

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-bold">{t("goals.dayGoals", { day: n(day) })}</h2>
        {!enabled && (
          <p className="mt-1 text-sm text-muted-foreground">{s.phase !== "ramadan" ? t("goals.onlyRamadan") : t("goals.future")}</p>
        )}
        <div className="mt-4 space-y-2">
          {GOALS.map((g) => (
            <button
              key={g}
              type="button"
              disabled={!enabled}
              onClick={() => toggle(day, g)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-start transition enabled:hover:border-brand/50 disabled:opacity-60",
                isDone(day, g) && "border-brand bg-secondary",
              )}
            >
              <span className={cn("flex size-6 items-center justify-center rounded-full border", isDone(day, g) && "border-transparent bg-primary text-primary-foreground")}>
                {isDone(day, g) && <Check className="size-4" />}
              </span>
              <span className={cn(isDone(day, g) && "font-bold")}>{t(`goals.items.${g}`)}</span>
            </button>
          ))}
        </div>
        <p className="mt-5 mb-2 text-sm font-medium">{t("goals.pickDay")}</p>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
          {Array.from({ length: s.daysInRamadan }, (_, i) => i + 1).map((d) => {
            const c = doneFor(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d)}
                className={cn(
                  "aspect-square rounded-lg border text-sm tabular-nums transition hover:border-brand/50",
                  c === GOALS.length && "bg-secondary text-brand",
                  c > 0 && c < GOALS.length && "border-gold/60",
                  d === day && "border-transparent bg-primary text-primary-foreground",
                )}
              >
                {n(d)}
              </button>
            );
          })}
        </div>
      </div>
      <aside className="hero-gradient h-fit rounded-2xl p-5 text-white">
        <p className="text-sm text-white/70">{t("goals.monthProgress")}</p>
        <p className="mt-1 text-4xl font-bold text-gold">{n(Math.round(monthProgress * 100))}%</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-gold" style={{ width: `${monthProgress * 100}%` }} />
        </div>
        <p className="mt-3 text-sm text-white/80">{t("goals.monthDetail", { goals: n(GOALS.length), days: n(s.daysInRamadan) })}</p>
        {s.phase === "ramadan" && (
          <p className="mt-1 text-sm text-white/80">{t("goals.todayDone", { done: n(doneFor(s.ramadanDay)), total: n(GOALS.length) })}</p>
        )}
      </aside>
    </section>
  );
}

function CheckChip({
  label,
  checked,
  disabled,
  onClick,
  big,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
  big?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={checked}
      className={cn(
        "flex items-center justify-center gap-1 rounded-full border px-3 py-1 text-xs transition enabled:hover:border-brand/50 disabled:opacity-50",
        big && "rounded-xl py-3 text-sm",
        checked && "border-transparent bg-primary text-primary-foreground",
      )}
    >
      {checked && <Check className="size-3.5" />}
      {label}
    </button>
  );
}

export function DuaCard({ title, text, source, meaning }: { title: string; text: string; source: string; meaning?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm font-bold text-brand">{title}</p>
      <p dir="rtl" className="mt-2 text-center text-2xl leading-loose">{text}</p>
      {meaning && <p className="mt-1 text-center text-sm text-muted-foreground">{meaning}</p>}
      <p className="mt-2 text-center text-xs text-gold">{source}</p>
    </div>
  );
}
