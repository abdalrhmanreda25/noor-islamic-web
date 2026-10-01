"use client";

import { Check, ChevronLeft, ChevronRight, Flame, Hourglass, Pause, Pencil, Play, Plus, RotateCcw, Sparkles, Trash2, Trophy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useNow } from "@/hooks/use-location";
import {
  bestStreak,
  canToggle,
  CATEGORIES,
  CHALLENGES_KEY,
  completedDays,
  currentStreak,
  doneInMonth,
  FEATURED_TEMPLATE_IDS,
  isComplete,
  isDone,
  ordered,
  progress,
  remainingDays,
  targetDays,
  templateById,
  TEMPLATES,
  type Category,
  type DayChallenge,
  type DayCountMode,
  type Template,
} from "@/lib/data/day-counter";
import { addDays, dayKey, daysBetween, formatGregorian, keyToDate } from "@/lib/data/hijri";
import { cn } from "@/lib/utils";

/** Arabic quotes (Quran/hadith) read right-to-left, translations left-to-right. */
const textDir = (s: string) => (/^[\s«﴿]*[\u0600-\u06FF]/.test(s) ? "rtl" : "ltr");

/** Unique-enough id for locally stored records. */
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** kDayCounterAccents mapped to theme tokens. */
const ACCENTS = [
  { text: "text-brand", bg: "bg-brand", stroke: "stroke-brand" },
  { text: "text-gold", bg: "bg-gold", stroke: "stroke-gold" },
  { text: "text-chart-3", bg: "bg-chart-3", stroke: "stroke-chart-3" },
  { text: "text-chart-4", bg: "bg-chart-4", stroke: "stroke-chart-4" },
  { text: "text-primary", bg: "bg-primary", stroke: "stroke-primary" },
  { text: "text-destructive", bg: "bg-destructive", stroke: "stroke-destructive" },
];
const accent = (i: number) => ACCENTS[i % ACCENTS.length];

type Editing = { challenge?: DayChallenge } | null;

export function DayCounter() {
  const t = useTranslations("day-counter");
  const locale = useLocale();
  const n = (x: number) => toLocaleDigits(x, locale);
  const now = useNow(60_000);
  const today = now ? dayKey(now) : null;
  const [list, setList] = useLocalStorage<DayChallenge[]>(CHALLENGES_KEY, []);
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!today) return <div className="h-96 rounded-2xl border bg-card" />;

  const update = (c: DayChallenge) => setList((l) => l.map((x) => (x.id === c.id ? c : x)));
  const remove = (id: string) => setList((l) => l.filter((x) => x.id !== id));
  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };
  const toggleDay = (c: DayChallenge, date: string) => {
    if (!canToggle(c, date, today)) return;
    const was = isComplete(c, today);
    const next = {
      ...c,
      completedDates: c.completedDates.includes(date) ? c.completedDates.filter((d) => d !== date) : [...c.completedDates, date].sort(),
    };
    update(next);
    if (!was && isComplete(next, today)) flash(t("completed", { title: c.title }));
  };
  const startTemplate = (tpl: Template) => {
    const c: DayChallenge = {
      id: newId(),
      title: tpl[locale === "ar" ? "ar" : "en"].title,
      targetDays: tpl.days,
      startedOn: today,
      completedDates: [],
      accent: tpl.accent,
      mode: "manual",
      templateId: tpl.id,
    };
    setList((l) => [...l, c]);
    setPicker(false);
  };

  const sorted = ordered(list, today);
  const expects = (c: DayChallenge) => !isComplete(c, today) && c.mode !== "countdown" && !c.paused;
  const activeCount = list.filter(expects).length;
  const markedToday = list.filter((c) => expects(c) && isDone(c, today, today)).length;
  const countdowns = list.filter((c) => !isComplete(c, today) && c.mode === "countdown").length;
  const best = list.reduce((b, c) => Math.max(b, bestStreak(c, today)), 0);
  const monthStart = `${today.slice(0, 8)}01`;
  const thisMonth = list.reduce((s, c) => (c.mode === "countdown" ? s : s + doneInMonth(c, monthStart, today)), 0);
  const overviewLine =
    activeCount > 0
      ? markedToday === activeCount
        ? t("overview.allDone")
        : t("overview.marked", { done: n(markedToday), total: n(activeCount) })
      : countdowns > 0
        ? t("overview.countdowns", { count: countdowns, n: n(countdowns) })
        : list.some((c) => c.paused && !isComplete(c, today))
          ? t("overview.allPaused")
          : t("overview.allComplete");
  const detailChallenge = list.find((c) => c.id === detail);

  return (
    <div className="space-y-6">
      {list.length === 0 ? (
        <section className="hero-gradient rounded-2xl p-6 text-white">
          <Hourglass className="size-10 text-gold" />
          <h2 className="mt-3 text-2xl font-bold">{t("empty.title")}</h2>
          <p className="mt-1 text-white/80">{t("empty.body")}</p>
          <p className="mt-4 text-lg text-gold">{t("empty.quote")}</p>
          <p className="text-xs text-white/60">{t("empty.source")}</p>
        </section>
      ) : (
        <section className="hero-gradient grid gap-4 rounded-2xl p-5 text-white sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-lg font-bold text-gold">{overviewLine}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-gold" style={{ width: `${activeCount ? (markedToday / activeCount) * 100 : 100}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              [activeCount + countdowns, t("overview.active")],
              [best, t("overview.bestStreak")],
              [thisMonth, t("overview.thisMonth")],
            ].map(([v, l]) => (
              <div key={l as string} className="rounded-xl bg-white/10 px-3 py-2">
                <p className="text-2xl font-bold tabular-nums">{n(v as number)}</p>
                <p className="text-[11px] text-white/70">{l}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{list.length ? t("mine") : t("empty.featured")}</h2>
        <Button onClick={() => setPicker(true)}>
          <Plus />
          {t("new")}
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURED_TEMPLATE_IDS.map((id) => (
            <TemplateTile key={id} tpl={templateById(id)!} running={false} onStart={startTemplate} />
          ))}
          <button type="button" onClick={() => setPicker(true)} className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground hover:border-brand/50 sm:col-span-2">
            {t("empty.all", { count: n(TEMPLATES.length) })}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((c) => (
            <ChallengeCard
              key={c.id}
              c={c}
              today={today}
              onOpen={() => setDetail(c.id)}
              onToggleToday={() => toggleDay(c, today)}
            />
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-xl bg-primary p-4 text-center text-primary-foreground shadow-lg">{toast}</div>
      )}

      <Dialog open={picker} onOpenChange={setPicker}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <TemplatePicker
            running={(id) => list.some((c) => c.templateId === id && !isComplete(c, today))}
            onStart={startTemplate}
            onCustom={() => {
              setPicker(false);
              setEditing({});
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editing != null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {editing && (
            <Editor
              today={today}
              initial={editing.challenge}
              onCancel={() => setEditing(null)}
              onSave={(c) => {
                if (editing.challenge) update(c);
                else setList((l) => [...l, c]);
                setEditing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detailChallenge != null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {detailChallenge && (
            <Detail
              c={detailChallenge}
              today={today}
              onToggle={(d) => toggleDay(detailChallenge, d)}
              onEdit={() => {
                setDetail(null);
                setEditing({ challenge: detailChallenge });
              }}
              onPause={() => update({ ...detailChallenge, paused: !detailChallenge.paused })}
              onReset={() => {
                if (confirm(t("confirm.reset", { title: detailChallenge.title })))
                  update({ ...detailChallenge, completedDates: [], importedDays: 0, startedOn: today });
              }}
              onDelete={() => {
                if (confirm(t("confirm.delete", { title: detailChallenge.title }))) {
                  remove(detailChallenge.id);
                  setDetail(null);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Ring({ value, accentIdx, children, size = 64 }: { value: number; accentIdx: number; children?: React.ReactNode; size?: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="size-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-muted" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
          className={accent(accentIdx).stroke}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">{children}</div>
    </div>
  );
}

function ChallengeCard({ c, today, onOpen, onToggleToday }: { c: DayChallenge; today: string; onOpen: () => void; onToggleToday: () => void }) {
  const t = useTranslations("day-counter");
  const locale = useLocale();
  const n = (x: number) => toLocaleDigits(x, locale);
  const done = completedDays(c, today);
  const total = targetDays(c, today);
  const complete = isComplete(c, today);
  const doneToday = isDone(c, today, today);
  const streak = currentStreak(c, today);
  const bestS = bestStreak(c, today);
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  return (
    <div className={cn("flex flex-col rounded-2xl border bg-card p-5 transition hover:border-brand/50", complete && "opacity-80")}>
      <button type="button" onClick={onOpen} className="flex items-start gap-3 text-start">
        <Ring value={progress(c, today)} accentIdx={c.accent}>
          {n(c.mode === "countdown" ? remainingDays(c, today) : done)}
        </Ring>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{c.title}</p>
          <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
            {c.paused && <span className="rounded-full bg-muted px-2 py-0.5">{t("card.paused")}</span>}
            {c.mode === "auto" && <span className="rounded-full bg-secondary px-2 py-0.5">{t("card.auto")}</span>}
            {c.mode === "countdown" && <span className="rounded-full bg-secondary px-2 py-0.5">{t("card.countdown")}</span>}
            {streak > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-gold/20 px-2 py-0.5">
                <Flame className="size-3" />
                {t("card.streak", { n: n(streak) })}
              </span>
            )}
            {bestS > 1 && c.mode === "manual" && <span className="rounded-full bg-muted px-2 py-0.5">{t("card.best", { n: n(bestS) })}</span>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {c.mode === "countdown"
              ? complete
                ? t("card.arrived")
                : `${t("card.left", { days: t("days", { count: remainingDays(c, today), n: n(remainingDays(c, today)) }) })} · ${c.targetDate ? formatGregorian(c.targetDate, locale, { day: "numeric", month: "short", year: "numeric" }) : ""}`
              : complete
                ? t("card.complete", { n: n(total) })
                : t("card.progress", { done: n(done), total: n(total) }) + t("card.remaining", { n: n(remainingDays(c, today)) })}
          </p>
        </div>
      </button>
      {c.mode !== "countdown" && (
        <div className="mt-3 flex justify-between gap-1">
          {week.map((d) => (
            <span
              key={d}
              className={cn("h-1.5 flex-1 rounded-full bg-muted", isDone(c, d, today) && accent(c.accent).bg, d === today && "ring-1 ring-gold")}
            />
          ))}
        </div>
      )}
      <div className="mt-4">
        {c.mode === "manual" && !complete && !c.paused ? (
          <Button variant={doneToday ? "secondary" : "default"} className="w-full" onClick={onToggleToday}>
            <Check />
            {doneToday ? `${t("checkIn.done")} · ${t("checkIn.undo")}` : t("checkIn.markToday")}
          </Button>
        ) : (
          <p className="rounded-lg bg-secondary px-3 py-2 text-center text-xs text-muted-foreground">
            {complete
              ? c.mode === "countdown"
                ? t("checkIn.arrived")
                : t("checkIn.complete")
              : c.paused
                ? t("checkIn.paused")
                : c.mode === "countdown"
                  ? t("checkIn.countdownInfo", { date: formatGregorian(c.targetDate ?? today, locale) })
                  : t("checkIn.autoInfo", { date: formatGregorian(c.startedOn, locale) })}
          </p>
        )}
      </div>
    </div>
  );
}

function TemplateTile({ tpl, running, onStart }: { tpl: Template; running: boolean; onStart: (t: Template) => void }) {
  const t = useTranslations("day-counter");
  const locale = useLocale();
  const text = tpl[locale === "ar" ? "ar" : "en"];
  return (
    <div className="flex flex-col rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className={cn("font-bold", accent(tpl.accent).text)}>{text.title}</p>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs">{t("days", { count: tpl.days, n: toLocaleDigits(tpl.days, locale) })}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{text.description}</p>
      <p dir={textDir(text.quote)} className="mt-2 text-sm leading-7">{text.quote}</p>
      <p className="text-xs text-gold">{text.source}</p>
      <Button size="sm" className="mt-3 self-start" disabled={running} onClick={() => onStart(tpl)}>
        {running ? t("templates.running") : t("templates.start")}
      </Button>
    </div>
  );
}

function TemplatePicker({ running, onStart, onCustom }: { running: (id: string) => boolean; onStart: (t: Template) => void; onCustom: () => void }) {
  const t = useTranslations("day-counter");
  const [cat, setCat] = useState<Category | "all">("all");
  return (
    <div className="space-y-4">
      <div>
        <DialogTitle className="text-lg font-bold">{t("templates.title")}</DialogTitle>
        <p className="text-sm text-muted-foreground">{t("templates.subtitle")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["all", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={cn("rounded-full border px-3 py-1 text-sm", cat === c && "border-transparent bg-primary text-primary-foreground")}
          >
            {t(`categories.${c}`)}
          </button>
        ))}
      </div>
      <button type="button" onClick={onCustom} className="flex w-full items-center gap-3 rounded-2xl border border-dashed p-4 text-start hover:border-brand/50">
        <Sparkles className="size-6 text-gold" />
        <span>
          <span className="block font-bold">{t("templates.custom")}</span>
          <span className="block text-sm text-muted-foreground">{t("templates.customDesc")}</span>
        </span>
      </button>
      <div className="grid gap-3 sm:grid-cols-2">
        {TEMPLATES.filter((tp) => cat === "all" || tp.category === cat).map((tp) => (
          <TemplateTile key={tp.id} tpl={tp} running={running(tp.id)} onStart={onStart} />
        ))}
      </div>
    </div>
  );
}

function Editor({ today, initial, onSave, onCancel }: { today: string; initial?: DayChallenge; onSave: (c: DayChallenge) => void; onCancel: () => void }) {
  const t = useTranslations("day-counter");
  const [mode, setMode] = useState<DayCountMode>(initial?.mode ?? "manual");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [days, setDays] = useState(String(initial?.targetDays ?? 40));
  const [start, setStart] = useState(initial?.startedOn ?? today);
  const [target, setTarget] = useState(initial?.targetDate ?? addDays(today, 30));
  const [acc, setAcc] = useState(initial?.accent ?? 0);
  const [tried, setTried] = useState(false);
  const d = Number(days);
  const errName = !title.trim();
  const errDays = mode !== "countdown" && (!Number.isInteger(d) || d < 1 || d > 3650);
  const errTarget = mode === "countdown" && target <= start;

  const save = () => {
    setTried(true);
    if (errName || errDays || errTarget) return;
    onSave({
      ...(initial ?? { id: newId(), completedDates: [] }),
      title: title.trim(),
      mode,
      targetDays: mode === "countdown" ? Math.max(1, daysBetween(start, target)) : d,
      startedOn: start,
      targetDate: mode === "countdown" ? target : null,
      accent: acc,
    });
  };

  return (
    <div className="space-y-4">
      <DialogTitle className="text-lg font-bold">{initial ? t("editor.edit") : t("editor.new")}</DialogTitle>
      <div>
        <p className="mb-1.5 text-sm font-medium">{t("editor.mode")}</p>
        <div className="grid grid-cols-3 gap-2">
          {(["manual", "auto", "countdown"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn("rounded-xl border px-3 py-2 text-sm", mode === m && "border-transparent bg-primary text-primary-foreground")}
            >
              {t(`editor.modes.${m}`)}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{t(`editor.modeDesc.${mode}`)}</p>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{t("editor.name")}</span>
        <Input value={title} placeholder={t("editor.nameHint")} onChange={(e) => setTitle(e.target.value)} />
        {tried && errName && <span className="text-xs text-destructive">{t("editor.nameError")}</span>}
      </label>
      {mode !== "countdown" && (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("editor.days")}</span>
          <Input inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
          {tried && errDays && <span className="text-xs text-destructive">{t("editor.daysError")}</span>}
        </label>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("editor.start")}</span>
          <Input type="date" value={start} onChange={(e) => e.target.value && setStart(e.target.value)} />
        </label>
        {mode === "countdown" && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">{t("editor.target")}</span>
            <Input type="date" value={target} onChange={(e) => e.target.value && setTarget(e.target.value)} />
          </label>
        )}
      </div>
      {tried && errTarget && <p className="text-xs text-destructive">{t("editor.targetError")}</p>}
      <div>
        <p className="mb-1.5 text-sm font-medium">{t("editor.color")}</p>
        <div className="flex gap-2">
          {ACCENTS.map((a, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}`}
              onClick={() => setAcc(i)}
              className={cn("size-8 rounded-full", a.bg, acc === i && "ring-2 ring-foreground ring-offset-2 ring-offset-background")}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={save}>
          {initial ? t("editor.save") : t("editor.create")}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          {t("editor.cancel")}
        </Button>
      </div>
    </div>
  );
}

function Detail({
  c,
  today,
  onToggle,
  onEdit,
  onPause,
  onReset,
  onDelete,
}: {
  c: DayChallenge;
  today: string;
  onToggle: (d: string) => void;
  onEdit: () => void;
  onPause: () => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("day-counter");
  const locale = useLocale();
  const n = (x: number) => toLocaleDigits(x, locale);
  const [offset, setOffset] = useState(0);
  const tpl = templateById(c.templateId);
  const [y, m] = today.split("-").map(Number);
  const monthStart = new Date(Date.UTC(y, m - 1 + offset, 1, 12)).toISOString().slice(0, 10);
  const ms = keyToDate(monthStart);
  const len = new Date(Date.UTC(ms.getUTCFullYear(), ms.getUTCMonth() + 1, 0)).getUTCDate();
  const lead = (ms.getUTCDay() + 1) % 7;
  const Prev = locale === "ar" ? ChevronRight : ChevronLeft;
  const Next = locale === "ar" ? ChevronLeft : ChevronRight;
  const stats =
    c.mode === "countdown"
      ? [
          [remainingDays(c, today), t("stats.remaining")],
          [completedDays(c, today), t("stats.elapsed")],
          [targetDays(c, today), t("stats.span")],
        ]
      : [
          [completedDays(c, today), t("stats.done")],
          [remainingDays(c, today), t("stats.remaining")],
          [currentStreak(c, today), t("stats.streak")],
          [bestStreak(c, today), t("stats.best")],
        ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Ring value={progress(c, today)} accentIdx={c.accent} size={72}>
          {n(Math.round(progress(c, today) * 100))}%
        </Ring>
        <div>
          <DialogTitle className="text-lg font-bold">{c.title}</DialogTitle>
          <p className="text-xs text-muted-foreground">{t("started", { date: formatGregorian(c.startedOn, locale) })}</p>
        </div>
      </div>
      {tpl && (
        <div className="rounded-xl bg-secondary p-3">
          <p dir={textDir(tpl[locale === "ar" ? "ar" : "en"].quote)} className="text-sm leading-7">{tpl[locale === "ar" ? "ar" : "en"].quote}</p>
          <p className="text-xs text-gold">{tpl[locale === "ar" ? "ar" : "en"].source}</p>
        </div>
      )}
      <div className={cn("grid gap-2 text-center", stats.length === 4 ? "grid-cols-4" : "grid-cols-3")}>
        {stats.map(([v, l]) => (
          <div key={l as string} className="rounded-xl border p-2">
            <p className="text-lg font-bold tabular-nums">{n(v as number)}</p>
            <p className="text-[11px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-3">
        <div className="mb-2 flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => setOffset((o) => o - 1)} aria-label={t("calendar.prev")}>
            <Prev />
          </Button>
          <div className="flex-1 text-center">
            <p className="text-sm font-bold">{formatGregorian(monthStart, locale, { month: "long", year: "numeric" })}</p>
            <p className="text-xs text-muted-foreground">{t("calendar.doneInMonth", { n: n(doneInMonth(c, monthStart, today)) })}</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => setOffset((o) => o + 1)} aria-label={t("calendar.next")}>
            <Next />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
          {(t.raw("calendar.weekdays") as string[]).map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: lead }, (_, i) => <span key={`l${i}`} />)}
          {Array.from({ length: len }, (_, i) => {
            const key = addDays(monthStart, i);
            const done = isDone(c, key, today);
            const can = canToggle(c, key, today);
            return (
              <button
                key={key}
                type="button"
                disabled={!can}
                onClick={() => onToggle(key)}
                className={cn(
                  "aspect-square rounded-md text-xs tabular-nums",
                  done ? cn(accent(c.accent).bg, "text-white") : "bg-muted/60",
                  !can && !done && "opacity-40",
                  key === today && "ring-2 ring-gold",
                )}
              >
                {n(i + 1)}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{c.mode === "manual" ? t("calendar.manualHint") : t("calendar.autoHint")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil />
          {t("actions.edit")}
        </Button>
        {c.mode === "manual" && (
          <Button variant="outline" size="sm" onClick={onPause}>
            {c.paused ? <Play /> : <Pause />}
            {c.paused ? t("actions.resume") : t("actions.pause")}
          </Button>
        )}
        {c.mode !== "countdown" && (
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw />
            {t("actions.reset")}
          </Button>
        )}
        <Button variant="outline" size="sm" className="text-destructive" onClick={onDelete}>
          <Trash2 />
          {t("actions.delete")}
        </Button>
      </div>
      {isComplete(c, today) && (
        <p className="flex items-center gap-2 rounded-xl bg-gold/15 p-3 text-sm">
          <Trophy className="size-4 text-gold" />
          {c.mode === "countdown" ? t("checkIn.arrived") : t("checkIn.complete")}
        </p>
      )}
    </div>
  );
}
