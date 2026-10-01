"use client";

import {
  ArrowRightLeft,
  BookOpenText,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  EllipsisVertical,
  LayoutTemplate,
  Pencil,
  Plus,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useLocation, useNow } from "@/hooks/use-location";
import { Link } from "@/i18n/navigation";
import {
  bestStreak,
  currentStreak,
  defaultItems,
  DEFAULT_KEYS,
  ITEMS_KEY,
  itemTitle,
  LOG_KEY,
  monthStats,
  percents,
  PERIODS,
  ROUTINES,
  templateByKey,
  TEMPLATES,
  type Period,
  type PlannerItem,
  type PlannerLog,
} from "@/lib/data/daily-planner";
import { addDays, dayKey, formatGregorian, formatHijri, keyToDate } from "@/lib/data/hijri";
import { computePrayerTimes, formatTime } from "@/lib/prayer";
import { cn } from "@/lib/utils";

/** Unique-enough id for locally stored records. */
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

type Dialogs =
  | { kind: "templates" }
  | { kind: "evidence"; item: PlannerItem }
  | { kind: "rename"; item: PlannerItem }
  | { kind: "move"; item: PlannerItem }
  | null;

export function DailyPlanner() {
  const t = useTranslations("daily-planner");
  const locale = useLocale();
  const n = (x: number) => toLocaleDigits(x, locale);
  const now = useNow(30_000);
  const today = now ? dayKey(now) : null;
  const loc = useLocation(false);
  const [items, setItems, itemsLoaded] = useLocalStorage<PlannerItem[] | null>(ITEMS_KEY, null);
  const [log, setLog, logLoaded] = useLocalStorage<PlannerLog>(LOG_KEY, {});
  const [viewed, setViewed] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPeriod, setNewPeriod] = useState<Period>("anytime");
  const [historyMonth, setHistoryMonth] = useState(0);

  const list = useMemo(() => items ?? [], [items]);
  const active = list.filter((i) => !i.deleted).sort((a, b) => a.sort - b.sort);
  const day = viewed ?? today;
  const isToday = day === today;

  // First run: seed the built-in defaults (kPlannerDefaults).
  useEffect(() => {
    if (itemsLoaded && items == null) setItems(defaultItems());
  }, [itemsLoaded, items, setItems]);

  // Opening the planner today creates today's record and adds new tasks to it.
  useEffect(() => {
    if (!today || !logLoaded || items == null) return;
    const rec = log[today] ?? {};
    const missing = items.filter((i) => !i.deleted && !(i.id in rec));
    if (!log[today] || missing.length) setLog((l) => ({ ...l, [today]: { ...Object.fromEntries(missing.map((i) => [i.id, false])), ...(l[today] ?? {}) } }));
  }, [today, logLoaded, items, log, setLog]);

  const p = useMemo(() => percents(log), [log]);

  if (!today || !day || items == null) return <div className="h-96 rounded-2xl border bg-card" />;

  const flash = (msg: string, undo?: () => void) => {
    setToast({ msg, undo });
    setTimeout(() => setToast((c) => (c?.msg === msg ? null : c)), 5000);
  };
  const record = log[day];
  const entries = record
    ? Object.keys(record)
        .map((id) => list.find((i) => i.id === id))
        .filter((i): i is PlannerItem => !!i && (!isToday || !i.deleted))
        .sort((a, b) => a.sort - b.sort)
    : [];
  const doneCount = entries.filter((i) => record?.[i.id]).length;

  const times = computePrayerTimes(loc.latitude, loc.longitude, keyToDate(day));
  const nowPeriod: Period | null =
    isToday && now
      ? now < times.times.fajr
        ? "before_fajr"
        : now < times.times.sunrise
          ? "fajr"
          : now < times.times.dhuhr
            ? "duha"
            : now < times.times.asr
              ? "dhuhr"
              : now < times.times.maghrib
                ? "asr"
                : now < times.times.isha
                  ? "maghrib"
                  : "isha"
      : null;
  const anchor = (per: Period) => {
    const map: Partial<Record<Period, Date>> = {
      before_fajr: times.times.fajr,
      fajr: times.times.fajr,
      duha: times.times.sunrise,
      dhuhr: times.times.dhuhr,
      asr: times.times.asr,
      maghrib: times.times.maghrib,
      isha: times.times.isha,
    };
    const d = map[per];
    const clock = d ? formatTime(d, locale, times.timeZone) : "";
    if (per === "before_fajr") return t("periodHint.beforeFajr", { time: clock });
    if (per === "duha") return t("periodHint.duha", { time: clock });
    if (per === "sleep") return t("periodHint.sleep");
    if (per === "anytime") return t("periodHint.anytime");
    return clock;
  };

  const toggle = (id: string) => setLog((l) => ({ ...l, [day]: { ...(l[day] ?? {}), [id]: !l[day]?.[id] } }));
  const nextSort = () => list.reduce((m, i) => Math.max(m, i.sort), 0) + 1;
  const addItems = (newOnes: PlannerItem[]) => {
    setItems((l) => [...(l ?? []), ...newOnes]);
  };
  const addTemplate = (key: string, sort = nextSort()) => {
    const tpl = templateByKey(key)!;
    const existing = list.find((i) => i.templateKey === key);
    if (existing && !existing.deleted) return 0;
    if (existing) setItems((l) => (l ?? []).map((i) => (i.id === existing.id ? { ...i, deleted: false, sort } : i)));
    else addItems([{ id: `t-${key}-${newId()}`, templateKey: key, period: tpl.period, sort }]);
    return 1;
  };
  const addRoutine = (key: (typeof ROUTINES)[number]["key"]) => {
    const r = ROUTINES.find((x) => x.key === key)!;
    let added = 0;
    let s = nextSort();
    for (const k of r.templateKeys) added += addTemplate(k, s++);
    const title = t(`routines.${key}.title`);
    flash(added ? t("routineAdded", { count: n(added), title }) : t("routineExists", { title }));
  };
  const restoreDefaults = () => {
    let restored = 0;
    let s = nextSort();
    for (const k of DEFAULT_KEYS) restored += addTemplate(k, s++);
    flash(restored ? t("restored", { count: n(restored) }) : t("allDefaultsExist"));
  };
  const removeItem = (item: PlannerItem) => {
    setItems((l) => (l ?? []).map((i) => (i.id === item.id ? { ...i, deleted: true } : i)));
    setLog((l) => {
      const rec = { ...(l[today] ?? {}) };
      delete rec[item.id];
      return { ...l, [today]: rec };
    });
    flash(t("item.deleted", { title: itemTitle(item, locale) }), () => {
      setItems((l) => (l ?? []).map((i) => (i.id === item.id ? { ...i, deleted: false } : i)));
      setToast(null);
    });
  };
  const updateItem = (id: string, patch: Partial<PlannerItem>) =>
    setItems((l) => (l ?? []).map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const Prev = locale === "ar" ? ChevronRight : ChevronLeft;
  const Next = locale === "ar" ? ChevronLeft : ChevronRight;
  const streak = currentStreak(p, today);
  const dayLabel = isToday ? t("today") : day === addDays(today, -1) ? t("yesterday") : formatGregorian(day, locale, { weekday: "long" });

  // Week (Saturday → Friday) containing today.
  const wd = (keyToDate(today).getUTCDay() + 1) % 7;
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - wd));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        <section className="hero-gradient rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setViewed(addDays(day, -1))} aria-label={t("prevDay")}>
              <Prev />
            </Button>
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-gold">{dayLabel}</p>
              <p className="text-sm text-white/80">
                {formatGregorian(day, locale, { day: "numeric", month: "long", year: "numeric" })} · {formatHijri(day, locale)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              disabled={isToday}
              onClick={() => setViewed(addDays(day, 1) === today ? null : addDays(day, 1))}
              aria-label={t("nextDay")}
            >
              <Next />
            </Button>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${entries.length ? (doneCount / entries.length) * 100 : 0}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-white/85">
            <span>{entries.length ? t("progress", { done: n(doneCount), total: n(entries.length) }) : t("noTasks")}</span>
            <span>{t("streak", { count: streak, n: n(streak) })}</span>
            {nowPeriod && <span className="rounded-full bg-white/10 px-2 py-0.5 text-gold">{t("nowPeriod", { period: t(`periods.${nowPeriod}`) })}</span>}
            {!isToday && (
              <Button size="sm" variant="secondary" onClick={() => setViewed(null)}>
                {t("backToday")}
              </Button>
            )}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{isToday ? t("schedule") : t("pastSchedule")}</h2>
          {isToday && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDialog({ kind: "templates" })}>
                <LayoutTemplate />
                {t("templates")}
              </Button>
              <Button variant="outline" size="sm" onClick={restoreDefaults}>
                <RotateCcw />
                {t("restore")}
              </Button>
            </div>
          )}
        </div>
        {!isToday && <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">{t("pastNote")}</p>}

        {isToday && (
          <form
            className="flex flex-wrap gap-2 rounded-2xl border bg-card p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTitle.trim()) return;
              addItems([{ id: `u-${newId()}`, title: newTitle.trim(), period: newPeriod, sort: nextSort() }]);
              setNewTitle("");
            }}
          >
            <Input className="min-w-40 flex-1" placeholder={t("quickAdd.placeholder")} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <select
              aria-label={t("quickAdd.period")}
              className="h-8 rounded-lg border bg-transparent px-2 text-sm dark:bg-input/30"
              value={newPeriod}
              onChange={(e) => setNewPeriod(e.target.value as Period)}
            >
              {PERIODS.map((per) => (
                <option key={per} value={per} className="bg-popover">
                  {t(`periods.${per}`)}
                </option>
              ))}
            </select>
            <Button type="submit">
              <Plus />
              {t("quickAdd.add")}
            </Button>
          </form>
        )}

        {!record && !isToday ? (
          <div className="rounded-2xl border bg-card p-6 text-center">
            <p className="font-bold">{t("empty.noRecord")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("empty.noRecordBody")}</p>
            <Button className="mt-4" onClick={() => setLog((l) => ({ ...l, [day]: Object.fromEntries(active.map((i) => [i.id, false])) }))}>
              {t("empty.createRecord")}
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border bg-card p-6 text-center">
            <p className="text-lg font-bold">{t("empty.title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("empty.body")}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {ROUTINES.map((r) => (
                <button key={r.key} type="button" onClick={() => addRoutine(r.key)} className="rounded-xl border p-3 text-start hover:border-brand/50">
                  <p className="font-bold">{t(`routines.${r.key}.title`)}</p>
                  <p className="text-xs text-muted-foreground">{t(`routines.${r.key}.subtitle`)}</p>
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setDialog({ kind: "templates" })}>
                {t("empty.browse")}
              </Button>
              <Button variant="outline" size="sm" onClick={restoreDefaults}>
                {t("restore")}
              </Button>
            </div>
          </div>
        ) : (
          PERIODS.filter((per) => entries.some((i) => i.period === per)).map((per) => (
            <section key={per} className={cn("rounded-2xl border bg-card p-4", per === nowPeriod && "border-brand ring-1 ring-brand/30")}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="font-bold">
                  {t(`periods.${per}`)}
                  {per === nowPeriod && <span className="ms-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{t("periodHint.now")}</span>}
                </h3>
                <span className="text-xs text-muted-foreground tabular-nums">{anchor(per)}</span>
              </div>
              <ul className="space-y-1.5">
                {entries
                  .filter((i) => i.period === per)
                  .map((item) => {
                    const done = !!record?.[item.id];
                    const tpl = templateByKey(item.templateKey);
                    return (
                      <li key={item.id} className={cn("flex items-center gap-2 rounded-xl border px-3 py-2", done && "bg-secondary")}>
                        <button
                          type="button"
                          onClick={() => toggle(item.id)}
                          aria-pressed={done}
                          className="flex min-w-0 flex-1 items-center gap-3 text-start"
                        >
                          <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border", done && "border-transparent bg-primary text-primary-foreground")}>
                            {done && <Check className="size-4" />}
                          </span>
                          <span className={cn("min-w-0 flex-1", done && "text-muted-foreground line-through")}>{itemTitle(item, locale)}</span>
                        </button>
                        {tpl?.route && (
                          <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href={tpl.route} />} aria-label={t("item.open")}>
                            <ExternalLink />
                          </Button>
                        )}
                        {isToday && (
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={t("item.options")} />}>
                              <EllipsisVertical />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {tpl && (
                                <DropdownMenuItem onClick={() => setDialog({ kind: "evidence", item })}>
                                  <BookOpenText />
                                  {t("item.evidence")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setDialog({ kind: "rename", item })}>
                                <Pencil />
                                {t("item.rename")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDialog({ kind: "move", item })}>
                                <ArrowRightLeft />
                                {t("item.move")}
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onClick={() => removeItem(item)}>
                                <Trash2 />
                                {t("item.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4 text-center">
          <p className="font-bold leading-7">{t("hadith")}</p>
          <p className="text-xs text-gold">{t("hadithSource")}</p>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <h3 className="font-bold">{t("week.title")}</h3>
          <p className="mb-3 text-xs text-muted-foreground">{t("week.hint")}</p>
          <div className="grid grid-cols-7 gap-1 text-center">
            {week.map((d, i) => {
              const v = p[d];
              const future = d > today;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={future}
                  onClick={() => setViewed(d === today ? null : d)}
                  className={cn("flex flex-col items-center gap-1 rounded-lg p-1 disabled:opacity-40", d === day && "bg-secondary")}
                >
                  <span className="text-[10px] text-muted-foreground">{(t.raw("week.days") as string[])[i]}</span>
                  <PercentDot value={v} today={d === today} />
                </button>
              );
            })}
          </div>
        </div>

        <History
          p={p}
          today={today}
          offset={historyMonth}
          setOffset={setHistoryMonth}
          selected={day}
          onPick={(d) => setViewed(d === today ? null : d)}
          best={bestStreak(p)}
        />
      </aside>

      {toast && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-primary p-4 text-primary-foreground shadow-lg">
          <span className="flex-1 text-sm">{toast.msg}</span>
          {toast.undo && (
            <Button size="sm" variant="secondary" onClick={toast.undo}>
              {t("item.undo")}
            </Button>
          )}
        </div>
      )}

      <Dialog open={dialog != null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {dialog?.kind === "templates" && (
            <TemplatesSheet
              added={(k) => active.some((i) => i.templateKey === k)}
              onAdd={(k) => addTemplate(k)}
              onRoutine={(k) => {
                addRoutine(k);
                setDialog(null);
              }}
            />
          )}
          {dialog?.kind === "evidence" && (
            <div className="space-y-3">
              <DialogTitle className="font-bold">{itemTitle(dialog.item, locale)}</DialogTitle>
              <p dir="rtl" className="text-lg leading-9">{templateByKey(dialog.item.templateKey)?.evidence}</p>
              <p className="text-sm text-gold">{templateByKey(dialog.item.templateKey)?.source[locale === "ar" ? "ar" : "en"]}</p>
            </div>
          )}
          {dialog?.kind === "rename" && (
            <RenameForm
              initial={itemTitle(dialog.item, locale)}
              onCancel={() => setDialog(null)}
              onSave={(title) => {
                updateItem(dialog.item.id, { title });
                setDialog(null);
              }}
            />
          )}
          {dialog?.kind === "move" && (
            <div className="space-y-3">
              <DialogTitle className="font-bold">{t("item.move")}</DialogTitle>
              <div className="grid grid-cols-2 gap-2">
                {PERIODS.map((per) => (
                  <button
                    key={per}
                    type="button"
                    onClick={() => {
                      updateItem(dialog.item.id, { period: per });
                      setDialog(null);
                    }}
                    className={cn("rounded-xl border p-3 text-sm", dialog.item.period === per && "border-brand bg-secondary font-bold")}
                  >
                    {t(`periods.${per}`)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PercentDot({ value, today, size = "size-7", label }: { value?: number; today?: boolean; size?: string; label?: string }) {
  const v = value ?? -1;
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full border text-[10px]",
        size,
        v < 0 && "bg-transparent",
        v >= 0 && v < 0.4 && "bg-brand/15",
        v >= 0.4 && v < 0.8 && "bg-brand/40",
        v >= 0.8 && v < 1 && "bg-brand/70 text-white",
        v >= 1 && "border-transparent bg-brand text-white",
        today && "ring-2 ring-gold",
      )}
    >
      {v >= 1 ? <Star className="size-3 fill-current" /> : label}
    </span>
  );
}

function History({
  p,
  today,
  offset,
  setOffset,
  selected,
  onPick,
  best,
}: {
  p: Record<string, number>;
  today: string;
  offset: number;
  setOffset: (f: (o: number) => number) => void;
  selected: string;
  onPick: (d: string) => void;
  best: number;
}) {
  const t = useTranslations("daily-planner");
  const locale = useLocale();
  const n = (x: number) => toLocaleDigits(x, locale);
  const [y, m] = today.split("-").map(Number);
  const monthStart = new Date(Date.UTC(y, m - 1 + offset, 1, 12)).toISOString().slice(0, 10);
  const ms = keyToDate(monthStart);
  const len = new Date(Date.UTC(ms.getUTCFullYear(), ms.getUTCMonth() + 1, 0)).getUTCDate();
  const lead = (ms.getUTCDay() + 1) % 7;
  const stats = monthStats(p, monthStart.slice(0, 8));
  const Prev = locale === "ar" ? ChevronRight : ChevronLeft;
  const Next = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <div className="rounded-2xl border bg-card p-4">
      <h3 className="font-bold">{t("history.title")}</h3>
      <div className="my-2 flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => setOffset((o) => o - 1)} aria-label={t("history.prev")}>
          <Prev />
        </Button>
        <p className="flex-1 text-center text-sm font-medium">{formatGregorian(monthStart, locale, { month: "long", year: "numeric" })}</p>
        <Button variant="ghost" size="icon-sm" disabled={offset >= 0} onClick={() => setOffset((o) => o + 1)} aria-label={t("history.next")}>
          <Next />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
        {(t.raw("week.days") as string[]).map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 justify-items-center gap-1">
        {Array.from({ length: lead }, (_, i) => <span key={`l${i}`} />)}
        {Array.from({ length: len }, (_, i) => {
          const d = addDays(monthStart, i);
          return (
            <button key={d} type="button" disabled={d > today} onClick={() => onPick(d)} className={cn("rounded-full disabled:opacity-30", d === selected && "ring-2 ring-foreground/40")}>
              <PercentDot value={p[d]} today={d === today} label={n(i + 1)} />
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        {t("history.less")}
        {[0.1, 0.5, 0.85, 1].map((v) => (
          <PercentDot key={v} value={v} size="size-3.5" />
        ))}
        {t("history.more")}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("history.hint")}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        {[
          [n(stats.complete), t("history.complete")],
          [n(stats.good), t("history.good")],
          [`${n(Math.round(stats.average * 100))}%`, t("history.average")],
          [n(best), t("history.best")],
        ].map(([v, l]) => (
          <div key={l} className="rounded-xl bg-secondary p-2">
            <p className="text-lg font-bold text-brand">{v}</p>
            <p className="text-[11px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplatesSheet({
  added,
  onAdd,
  onRoutine,
}: {
  added: (key: string) => boolean;
  onAdd: (key: string) => void;
  onRoutine: (key: (typeof ROUTINES)[number]["key"]) => void;
}) {
  const t = useTranslations("daily-planner");
  const locale = useLocale();
  const [filter, setFilter] = useState<Period | "all">("all");
  return (
    <div className="space-y-4">
      <DialogTitle className="text-lg font-bold">{t("templates")}</DialogTitle>
      <div>
        <p className="mb-2 text-sm font-medium">{t("templatesSheet.routines")}</p>
        <div className="grid gap-2">
          {ROUTINES.map((r) => (
            <button key={r.key} type="button" onClick={() => onRoutine(r.key)} className="rounded-xl border p-3 text-start hover:border-brand/50">
              <p className="font-bold">{t(`routines.${r.key}.title`)}</p>
              <p className="text-xs text-muted-foreground">{t(`routines.${r.key}.subtitle`)}</p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">{t("templatesSheet.singles")}</p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {(["all", ...PERIODS] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn("rounded-full border px-2.5 py-0.5 text-xs", filter === f && "border-transparent bg-primary text-primary-foreground")}
            >
              {f === "all" ? t("templatesSheet.all") : t(`periods.${f}`)}
            </button>
          ))}
        </div>
        <ul className="space-y-1.5">
          {TEMPLATES.filter((tp) => filter === "all" || tp.period === filter).map((tp) => {
            const isAdded = added(tp.key);
            return (
              <li key={tp.key} className="flex items-center gap-2 rounded-xl border p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{tp[locale === "ar" ? "ar" : "en"]}</p>
                  <p className="text-[11px] text-muted-foreground">{t(`periods.${tp.period}`)}</p>
                </div>
                <Button size="sm" variant={isAdded ? "secondary" : "default"} disabled={isAdded} onClick={() => onAdd(tp.key)}>
                  {isAdded ? t("templatesSheet.added") : t("templatesSheet.add")}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function RenameForm({ initial, onSave, onCancel }: { initial: string; onSave: (v: string) => void; onCancel: () => void }) {
  const t = useTranslations("daily-planner");
  const [v, setV] = useState(initial);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) onSave(v.trim());
      }}
    >
      <DialogTitle className="font-bold">{t("item.rename")}</DialogTitle>
      <Input autoFocus aria-label={t("item.name")} value={v} onChange={(e) => setV(e.target.value)} />
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {t("item.save")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("item.cancel")}
        </Button>
      </div>
    </form>
  );
}
