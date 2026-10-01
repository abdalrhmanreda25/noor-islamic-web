"use client";

import { BookOpen, CalendarCheck, Check, History, ListOrdered, Pencil, Plus, RotateCcw, Target, Trash2, Undo2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toLocaleDigits } from "@/components/page-header";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  JUZ_START,
  type KhatmaPlan,
  PLANS_KEY,
  TOTAL_PAGES,
  type Wird,
  buildSchedule,
  currentWird,
  dayNumber,
  hizbOf,
  isComplete,
  juzOf,
  progress,
  streak,
  ymd,
} from "./plan";

const PRESETS = [3, 7, 10, 15, 30, 60, 90, 120];

export function KhatmaManager() {
  const t = useTranslations("khatma");
  const [plans, setPlans, loaded] = useLocalStorage<KhatmaPlan[]>(PLANS_KEY, []);
  const [creating, setCreating] = useState(false);

  const update = (id: string, fn: (p: KhatmaPlan) => KhatmaPlan | null) =>
    setPlans((list) => list.flatMap((p) => (p.id === id ? (fn(p) ?? []) : [p])));

  if (!loaded) return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;

  return (
    <div className="space-y-4">
      {creating ? (
        <CreateForm
          onCancel={() => setCreating(false)}
          onCreate={(p) => {
            setPlans((list) => [p, ...list]);
            setCreating(false);
          }}
        />
      ) : (
        <Button size="lg" onClick={() => setCreating(true)} className="w-full sm:w-auto">
          <Plus className="size-4" /> {t("newKhatma")}
        </Button>
      )}

      {plans.length === 0 && !creating && (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <BookOpen className="mx-auto size-10 text-brand/60" />
          <p className="mt-3 font-bold">{t("empty")}</p>
          <p className="text-sm text-muted-foreground">{t("emptyHint")}</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((p) => (
          <KhatmaCard key={p.id} plan={p} onChange={(fn) => update(p.id, fn)} />
        ))}
      </div>
    </div>
  );
}

function CreateForm({ onCreate, onCancel }: { onCreate: (p: KhatmaPlan) => void; onCancel: () => void }) {
  const t = useTranslations("khatma");
  const locale = useLocale();
  const [name, setName] = useState("");
  const [days, setDays] = useState(30);
  const [startPage, setStartPage] = useState(1);
  const d = (n: number) => toLocaleDigits(n, locale);
  const valid = days >= 1 && days <= 1000 && startPage >= 1 && startPage <= TOTAL_PAGES;
  const preview = valid ? buildSchedule(startPage, days) : null;

  return (
    <form
      className="rounded-2xl border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onCreate({
          id: crypto.randomUUID?.() ?? String(Date.now()),
          name: name.trim() || t("defaultName"),
          startDate: ymd(),
          days,
          startPage,
          completedDays: [],
          currentPage: startPage - 1,
        });
      }}
    >
      <h2 className="mb-4 text-lg font-bold text-brand">{t("newKhatma")}</h2>
      <label className="mb-1 block text-sm font-medium">{t("name")}</label>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("defaultName")} className="mb-4" />

      <p className="mb-2 text-sm font-medium">{t("duration")}</p>
      <div className="mb-2 flex flex-wrap gap-2">
        {PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setDays(n)}
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              days === n ? "border-brand bg-primary font-bold text-primary-foreground" : "bg-secondary hover:border-brand/50"
            }`}
          >
            {t("days", { count: d(n) })}
          </button>
        ))}
      </div>
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="khatma-days">{t("customDays")}</label>
        <Input
          id="khatma-days"
          type="number"
          min={1}
          max={1000}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-24"
        />
      </div>

      <p className="mb-2 text-sm font-medium">{t("startFrom")}</p>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          {t("startJuz")}
          <select
            value={JUZ_START.includes(startPage) ? startPage : ""}
            onChange={(e) => setStartPage(Number(e.target.value))}
            className="h-9 rounded-md border bg-card px-2"
          >
            <option value="" disabled>—</option>
            {JUZ_START.map((p, i) => (
              <option key={p} value={p}>{d(i + 1)}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          {t("startPage")}
          <Input
            type="number"
            min={1}
            max={TOTAL_PAGES}
            value={startPage}
            onChange={(e) => setStartPage(Number(e.target.value))}
            className="w-24"
          />
        </label>
      </div>

      {preview && (
        <p className="mb-4 rounded-xl bg-secondary p-3 text-sm text-brand">
          {preview.hizbsPerDay
            ? t("previewHizb", { count: d(preview.hizbsPerDay), days: d(preview.wirds.length) })
            : t("preview", {
                pages: d(Math.ceil((TOTAL_PAGES - startPage + 1) / preview.wirds.length)),
                days: d(preview.wirds.length),
              })}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={!valid}>{t("create")}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>{t("cancel")}</Button>
      </div>
    </form>
  );
}

function Ring({ value, label }: { value: number; label: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-16 shrink-0">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-brand/15" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
          className="stroke-brand transition-all"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xs font-bold">{label}</span>
    </div>
  );
}

function KhatmaCard({ plan, onChange }: { plan: KhatmaPlan; onChange: (fn: (p: KhatmaPlan) => KhatmaPlan | null) => void }) {
  const t = useTranslations("khatma");
  const locale = useLocale();
  const d = (n: number) => toLocaleDigits(n, locale);
  const [editing, setEditing] = useState(false);
  const [pageInput, setPageInput] = useState(String(plan.currentPage));

  const { wirds } = useMemo(() => buildSchedule(plan.startPage, plan.days), [plan.startPage, plan.days]);
  const today = ymd();
  const done = isComplete(plan);
  const doneToday = plan.completedDays.includes(today);
  const wird = currentWird(plan, wirds);
  const pct = progress(plan);
  const wirdsDone = wirds.filter((w) => w.to <= plan.currentPage).length;
  const day = Math.max(1, dayNumber(plan, today));
  const expected = Math.min(day, wirds.length);
  const behind = expected - wirdsDone - (doneToday ? 0 : 1);
  const fmtDate = (s: string) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en", { dateStyle: "medium" }).format(new Date(`${s}T12:00:00`));

  const markDone = () =>
    onChange((p) => ({
      ...p,
      currentPage: Math.max(p.currentPage, wird.to),
      completedDays: p.completedDays.includes(today) ? p.completedDays : [...p.completedDays, today],
    }));
  const undo = () =>
    onChange((p) => {
      const last = wirds.find((w) => w.to === p.currentPage);
      return {
        ...p,
        currentPage: last ? last.from - 1 : p.currentPage,
        completedDays: p.completedDays.filter((x) => x !== today),
      };
    });

  const wirdTag = (w: Wird) => `${t("juz", { n: d(juzOf(w.from)) })} · ${t("hizb", { n: d(hizbOf(w.from)) })}`;

  return (
    <article className="rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-brand">{plan.name}</h3>
          <p className="text-xs text-muted-foreground">
            {t("startedOn", { date: fmtDate(plan.startDate) })} · {t("dayOf", { day: d(Math.min(day, plan.days)), days: d(plan.days) })}
          </p>
          {!done && (
            <p className={`mt-1 text-xs font-medium ${behind > 0 ? "text-destructive" : "text-brand"}`}>
              {behind > 0 ? t("behind", { count: d(behind) }) : behind < 0 ? t("ahead") : t("onTrack")}
            </p>
          )}
        </div>
        <Ring value={pct} label={`${d(Math.floor(pct * 100))}%`} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { label: t("lastPage"), value: d(plan.currentPage) },
          { label: t("remaining"), value: t("pages", { count: d(TOTAL_PAGES - plan.currentPage) }) },
          { label: t("daysDone"), value: d(plan.completedDays.length) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-secondary p-2">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-brand/15">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct * 100}%` }} />
      </div>

      {done ? (
        <div className="mt-4 rounded-xl border border-gold/50 bg-gold/10 p-4 text-center">
          <p className="font-bold text-gold">{t("completed")}</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() =>
              confirm(t("confirmRestart")) &&
              onChange((p) => ({ ...p, startDate: today, currentPage: p.startPage - 1, completedDays: [] }))
            }
          >
            <RotateCcw className="size-4" /> {t("restart")}
          </Button>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-brand/30 bg-secondary/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 font-bold">
              <Target className="size-4 text-gold" />
              {doneToday ? t("nextWird") : t("todayWird")} · {t("wirdLabel", { n: d(wird.n) })}
            </p>
            <span className="text-xs text-muted-foreground">{wirdTag(wird)}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t("wirdRange", { from: d(wird.from), to: d(wird.to) })}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button nativeButton={false} render={<Link href={`/quran/page/${wird.from}`} />}>
              <BookOpen className="size-4" /> {t("read")}
            </Button>
            {doneToday ? (
              <>
                <span className="flex items-center gap-1 rounded-lg bg-brand/10 px-3 text-sm font-medium text-brand">
                  <Check className="size-4" /> {t("doneToday")}
                </span>
                <Button variant="ghost" size="sm" onClick={undo} className="self-center">
                  <Undo2 className="size-4" /> {t("undo")}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={markDone}>
                <CalendarCheck className="size-4" />
                {t("markDone", { count: d(wird.to - Math.max(plan.currentPage, wird.from - 1)) })}
              </Button>
            )}
          </div>
        </div>
      )}

      {editing ? (
        <form
          className="mt-3 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = Number(pageInput);
            if (v >= 0 && v <= TOTAL_PAGES) onChange((p) => ({ ...p, currentPage: v }));
            setEditing(false);
          }}
        >
          <label className="text-sm" htmlFor={`page-${plan.id}`}>{t("lastPageRead")}</label>
          <Input id={`page-${plan.id}`} type="number" min={0} max={TOTAL_PAGES} value={pageInput} onChange={(e) => setPageInput(e.target.value)} className="w-24" />
          <Button type="submit" size="sm">{t("update")}</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>{t("cancel")}</Button>
        </form>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setPageInput(String(plan.currentPage)); setEditing(true); }}>
            <Pencil className="size-4" /> {t("updateProgress")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => confirm(t("confirmDelete")) && onChange(() => null)}
          >
            <Trash2 className="size-4" /> {t("delete")}
          </Button>
        </div>
      )}

      <details className="group mt-3 rounded-xl border">
        <summary className="flex cursor-pointer items-center gap-2 p-3 text-sm font-medium">
          <ListOrdered className="size-4 text-brand" /> {t("schedule")}
        </summary>
        <ol className="max-h-72 space-y-1 overflow-y-auto px-3 pb-3">
          {wirds.map((w) => {
            const isDone = w.to <= plan.currentPage;
            const isNow = !done && w.n === wird.n;
            return (
              <li key={w.n}>
                <Link
                  href={`/quran/page/${w.from}`}
                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted ${isNow ? "bg-secondary font-bold" : ""}`}
                >
                  <span className="flex items-center gap-2">
                    {isDone ? <Check className="size-4 text-brand" /> : <span className="size-4" />}
                    {t("wirdLabel", { n: d(w.n) })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("wirdRange", { from: d(w.from), to: d(w.to) })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </details>

      <details className="mt-2 rounded-xl border">
        <summary className="flex cursor-pointer items-center gap-2 p-3 text-sm font-medium">
          <History className="size-4 text-brand" /> {t("history")}
          {streak(plan) > 1 && <span className="ms-auto text-xs text-gold">{t("streak", { count: d(streak(plan)) })}</span>}
        </summary>
        {plan.completedDays.length === 0 ? (
          <p className="px-3 pb-3 text-sm text-muted-foreground">{t("noHistory")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2 px-3 pb-3">
            {[...plan.completedDays].reverse().map((day) => (
              <li key={day} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs">
                <Check className="size-3 text-brand" /> {fmtDate(day)}
              </li>
            ))}
          </ul>
        )}
      </details>
    </article>
  );
}
