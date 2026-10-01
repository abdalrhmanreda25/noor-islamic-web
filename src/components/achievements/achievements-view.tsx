"use client";

import { Award, BookOpen, Flame, Hourglass, Lock, NotebookPen, Pencil, Sparkles, Trash2, Trophy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useNow } from "@/hooks/use-location";
import { Link } from "@/i18n/navigation";
import {
  BADGES,
  BADGES_KEY,
  CATEGORIES,
  JOURNAL_CATEGORIES,
  JOURNAL_KEY,
  LEVELS,
  levelIndex,
  METRIC_ROUTE,
  readSignals,
  TIERS,
  type BadgeCategory,
  type BadgeDef,
  type JournalCategory,
  type JournalEntry,
  type Signals,
  type Tier,
} from "@/lib/data/achievements";
import { dayKey, formatGregorian } from "@/lib/data/hijri";
import { cn } from "@/lib/utils";

/** Unique-enough id for locally stored records. */
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const TIER_CLASS: Record<Tier, string> = {
  bronze: "bg-gold/35 text-foreground",
  silver: "bg-muted-foreground/30 text-foreground",
  gold: "bg-gold text-primary",
};
type Filter = "all" | "unlocked" | "inProgress" | "locked";
type Progress = { def: BadgeDef; current: number; unlockedAt?: string };
const status = (b: Progress): Exclude<Filter, "all"> => (b.unlockedAt ? "unlocked" : b.current > 0 ? "inProgress" : "locked");

export function AchievementsView() {
  const t = useTranslations("achievements");
  const locale = useLocale();
  const n = (x: number) => (locale === "ar" ? x.toLocaleString("ar-EG") : x.toLocaleString("en-US"));
  const now = useNow(60_000);
  const today = now ? dayKey(now) : null;
  const [tab, setTab] = useState<"badges" | "journal">("badges");
  const [stored, setStored, storedLoaded] = useLocalStorage<Record<string, string>>(BADGES_KEY, {});
  const [journal, setJournal, journalLoaded] = useLocalStorage<JournalEntry[]>(JOURNAL_KEY, []);
  const [signals, setSignals] = useState<Signals | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState<BadgeCategory | null>(null);
  const [open, setOpen] = useState<Progress | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!today || !journalLoaded) return;
    // Reading other features' localStorage is only possible after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSignals(readSignals(today, journal.length));
  }, [today, journal.length, journalLoaded]);

  const badges: Progress[] = useMemo(
    () => (signals ? BADGES.map((def) => ({ def, current: signals.values[def.metric], unlockedAt: stored[def.id] })) : []),
    [signals, stored],
  );

  // evaluateBadges: unlock newly reached targets and persist them (kept even if a signal later drops).
  useEffect(() => {
    if (!signals || !storedLoaded || !today) return;
    const fresh = BADGES.filter((d) => !stored[d.id] && signals.values[d.metric] >= d.target);
    if (!fresh.length) return;
    setStored((s) => ({ ...s, ...Object.fromEntries(fresh.map((d) => [d.id, today])) }));
    const title = fresh[0].title[locale === "ar" ? "ar" : "en"];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToast(fresh.length === 1 ? t("newUnlock", { title }) : t("newUnlocks", { count: toLocaleDigits(fresh.length, locale) }));
    const id = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [signals, storedLoaded, stored, setStored, today, locale, t]);

  if (!today || !signals) return <div className="h-96 rounded-2xl border bg-card" />;

  const points = badges.filter((b) => b.unlockedAt).reduce((s, b) => s + TIERS[b.def.tier], 0);
  const li = levelIndex(points);
  const next = LEVELS[li + 1];
  const levelProgress = next == null ? 1 : (points - LEVELS[li]) / (next - LEVELS[li]);
  const unlockedCount = badges.filter((b) => b.unlockedAt).length;
  const visible = badges.filter((b) => (filter === "all" || status(b) === filter) && (!category || b.def.category === category));
  const L = locale === "ar" ? "ar" : "en";

  return (
    <div className="space-y-6">
      <section className="hero-gradient rounded-2xl p-5 text-white">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-gold/20 ring-2 ring-gold">
            <Trophy className="size-8 text-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold text-gold">{t("level", { n: n(li + 1), title: (t.raw("levels") as string[])[li] })}</p>
            <p className="text-sm text-white/80">
              {t("points", { points: n(points) })}
              {next == null ? t("maxLevel") : t("toNext", { n: n(next - points) })}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-gold" style={{ width: `${levelProgress * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[
            [Award, `${n(unlockedCount)}/${n(BADGES.length)}`, t("unlocked")],
            [Flame, n(signals.prayerStreak), t("prayerStreak")],
            [Sparkles, n(signals.azkarStreak), t("azkarStreak")],
          ].map(([Icon, v, l]) => {
            const I = Icon as typeof Award;
            return (
              <div key={l as string} className="rounded-xl bg-white/10 p-2">
                <I className="mx-auto size-4 text-gold" />
                <p className="text-lg font-bold">{v as string}</p>
                <p className="text-[11px] text-white/70">{l as string}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-sm text-white/85">
          {t("summaryQuote")} <span className="text-gold">· {t("summarySource")}</span>
        </p>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="mb-3 font-bold">{t("stats.title")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            [signals.values.prayerFullDays, t("stats.prayerFullDays")],
            [signals.values.azkarFullDays, t("stats.azkarFullDays")],
            [signals.totalFasts, t("stats.fasts")],
            [signals.values.tasbeehTotal, t("stats.tasbeeh")],
            [signals.values.khatmas, t("stats.khatmas")],
            [signals.lastPage, t("stats.lastPage")],
          ].map(([v, l]) => (
            <div key={l as string} className="rounded-xl bg-secondary p-3 text-center">
              <p className="text-xl font-bold text-brand">{n(v as number)}</p>
              <p className="text-xs text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <Link href="/day-counter" className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-sm hover:border-brand/50">
        <Hourglass className="size-5 text-gold" />
        {t("dayCounterLink")}
      </Link>

      <div className="flex gap-2">
        {(["badges", "journal"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn("flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm", tab === id && "border-transparent bg-primary text-primary-foreground")}
          >
            {id === "badges" ? <Award className="size-4" /> : <NotebookPen className="size-4" />}
            {t(`tabs.${id}`)}
          </button>
        ))}
      </div>

      {tab === "badges" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "unlocked", "inProgress", "locked"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn("rounded-full border px-3 py-1 text-sm", filter === f && "border-transparent bg-primary text-primary-foreground")}
              >
                {t(`filters.${f}`)} ({n(f === "all" ? badges.length : badges.filter((b) => status(b) === f).length)})
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {([null, ...CATEGORIES] as const).map((c) => (
              <button
                key={c ?? "all"}
                type="button"
                onClick={() => setCategory(c)}
                className={cn("rounded-full bg-secondary px-3 py-1 text-xs", category === c && "bg-brand text-white")}
              >
                {c ? t(`categories.${c}`) : t("allCategories")}
              </button>
            ))}
          </div>
          {visible.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <p className="font-bold">{t("empty")}</p>
              <p className="text-sm text-muted-foreground">{t("emptyHint")}</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((b) => {
                const shown = b.unlockedAt ? b.def.target : Math.min(b.current, b.def.target);
                return (
                  <button
                    key={b.def.id}
                    type="button"
                    onClick={() => setOpen(b)}
                    className={cn("flex items-center gap-3 rounded-2xl border bg-card p-4 text-start transition hover:border-brand/50", !b.unlockedAt && "opacity-90")}
                  >
                    <Medal tier={b.def.tier} unlocked={!!b.unlockedAt} />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{b.def.title[L]}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{b.def.description[L]}</p>
                      {b.unlockedAt ? (
                        <p className="mt-1 text-xs text-brand">{t("unlockedOn", { date: formatGregorian(b.unlockedAt, locale, { dateStyle: "medium" }) })}</p>
                      ) : (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <span className="block h-full rounded-full bg-brand" style={{ width: `${(shown / b.def.target) * 100}%` }} />
                          </span>
                          <span className="text-[11px] tabular-nums text-muted-foreground">
                            {n(shown)}/{n(b.def.target)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <Journal entries={journal} setEntries={setJournal} today={today} />
      )}

      <Dialog open={open != null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-md">{open && <BadgeDetail b={open} />}</DialogContent>
      </Dialog>

      {toast && <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-xl bg-primary p-4 text-center text-primary-foreground shadow-lg">🎉 {toast}</div>}
    </div>
  );
}

function Medal({ tier, unlocked, big }: { tier: Tier; unlocked: boolean; big?: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        big ? "size-20" : "size-12",
        unlocked ? TIER_CLASS[tier] : "bg-muted text-muted-foreground",
      )}
    >
      {unlocked ? <Award className={big ? "size-10" : "size-6"} /> : <Lock className={big ? "size-8" : "size-5"} />}
    </span>
  );
}

function BadgeDetail({ b }: { b: Progress }) {
  const t = useTranslations("achievements");
  const locale = useLocale();
  const n = (x: number) => (locale === "ar" ? x.toLocaleString("ar-EG") : x.toLocaleString("en-US"));
  const L = locale === "ar" ? "ar" : "en";
  const shown = b.unlockedAt ? b.def.target : Math.min(b.current, b.def.target);
  const [quote, source] = t.raw(`quotes.${b.def.category}`) as [string, string];
  const route = METRIC_ROUTE[b.def.metric];
  return (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        <Medal tier={b.def.tier} unlocked={!!b.unlockedAt} big />
      </div>
      <div>
        <DialogTitle className="text-xl font-bold">{b.def.title[L]}</DialogTitle>
        <p className="text-xs text-muted-foreground">
          {t("detail.meta", { tier: t(`tiers.${b.def.tier}`), category: t(`categories.${b.def.category}`), points: n(TIERS[b.def.tier]) })}
        </p>
      </div>
      <div className="rounded-xl bg-secondary p-3 text-start">
        <p className="text-xs font-bold text-brand">{t("detail.how")}</p>
        <p className="text-sm">{b.def.description[L]}</p>
      </div>
      <div className="text-start">
        <p className="mb-1 text-xs font-bold text-brand">{b.unlockedAt ? t("detail.done") : t("detail.progress")}</p>
        {b.unlockedAt ? (
          <p className="text-sm">{t("detail.unlockedOn", { date: formatGregorian(b.unlockedAt, locale) })}</p>
        ) : (
          <>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand" style={{ width: `${(shown / b.def.target) * 100}%` }} />
            </div>
            <p className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{t("detail.of", { shown: n(shown), target: n(b.def.target), unit: b.def.unit[L] })}</span>
              <span>{t("detail.left", { n: n(b.def.target - shown) })}</span>
            </p>
          </>
        )}
      </div>
      <div className="rounded-xl border border-gold/40 bg-gold/10 p-3">
        <p dir={/^[\s«﴿]*[\u0600-\u06FF]/.test(quote) ? "rtl" : "ltr"} className="leading-8">{quote}</p>
        <p className="text-xs text-gold">{source}</p>
      </div>
      {!b.unlockedAt && route && (
        <Button className="w-full" nativeButton={false} render={<Link href={route} />}>
          <BookOpen />
          {t("detail.start")}
        </Button>
      )}
    </div>
  );
}

function Journal({ entries, setEntries, today }: { entries: JournalEntry[]; setEntries: (f: (e: JournalEntry[]) => JournalEntry[]) => void; today: string }) {
  const t = useTranslations("achievements");
  const locale = useLocale();
  const n = (x: number) => toLocaleDigits(x, locale);
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [cat, setCat] = useState<JournalCategory>("quran");
  const [tried, setTried] = useState(false);
  const [filter, setFilter] = useState<JournalCategory | null>(null);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const list = [...entries].reverse().filter((e) => !filter || e.category === filter);

  return (
    <section className="grid gap-4 lg:grid-cols-[22rem_1fr]">
      <form
        className="h-fit space-y-3 rounded-2xl border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          setTried(true);
          if (!text.trim()) return;
          setEntries((l) => [...l, { id: newId(), text: text.trim(), message: message.trim() || undefined, category: cat, date: today }]);
          setText("");
          setMessage("");
          setTried(false);
        }}
      >
        <p className="font-bold">{t("journal.question")}</p>
        <Input placeholder={t("journal.placeholder")} value={text} onChange={(e) => setText(e.target.value)} />
        {tried && !text.trim() && <p className="text-xs text-destructive">{t("journal.required")}</p>}
        <div className="flex flex-wrap gap-1.5">
          {JOURNAL_CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} className={cn("rounded-full border px-3 py-1 text-xs", cat === c && "border-transparent bg-primary text-primary-foreground")}>
              {t(`journal.categories.${c}`)}
            </button>
          ))}
        </div>
        <Input placeholder={t("journal.messageHint")} aria-label={t("journal.message")} value={message} onChange={(e) => setMessage(e.target.value)} />
        <Button type="submit" className="w-full">
          <NotebookPen />
          {t("journal.add")}
        </Button>
      </form>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">{t("journal.total", { count: n(entries.length) })}</p>
          {entries.length > 0 && (
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => confirm(t("journal.deleteAllConfirm")) && setEntries(() => [])}>
              <Trash2 />
              {t("journal.deleteAll")}
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {([null, ...JOURNAL_CATEGORIES] as const).map((c) => (
            <button key={c ?? "all"} type="button" onClick={() => setFilter(c)} className={cn("rounded-full bg-secondary px-3 py-1 text-xs", filter === c && "bg-brand text-white")}>
              {c ? t(`journal.categories.${c}`) : t("journal.all")}
            </button>
          ))}
        </div>
        {entries.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center">
            <p className="font-bold">{t("journal.emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("journal.emptyBody")}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map((e) => (
              <li key={e.id} className="flex items-start gap-3 rounded-2xl border bg-card p-4">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-brand">{t(`journal.categories.${e.category}`)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{e.text}</p>
                  {e.message && <p className="text-sm text-gold">{e.message}</p>}
                  <p className="text-xs text-muted-foreground">{formatGregorian(e.date, locale, { dateStyle: "medium" })}</p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label={t("journal.edit")} onClick={() => setEditing(e)}>
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("journal.delete")}
                  onClick={() => confirm(t("journal.deleteConfirm")) && setEntries((l) => l.filter((x) => x.id !== e.id))}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={editing != null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          {editing && (
            <form
              className="space-y-3"
              onSubmit={(ev) => {
                ev.preventDefault();
                if (!editing.text.trim()) return;
                setEntries((l) => l.map((x) => (x.id === editing.id ? editing : x)));
                setEditing(null);
              }}
            >
              <DialogTitle className="font-bold">{t("journal.edit")}</DialogTitle>
              <Input value={editing.text} onChange={(ev) => setEditing({ ...editing, text: ev.target.value })} />
              <div className="flex flex-wrap gap-1.5">
                {JOURNAL_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditing({ ...editing, category: c })}
                    className={cn("rounded-full border px-3 py-1 text-xs", editing.category === c && "border-transparent bg-primary text-primary-foreground")}
                  >
                    {t(`journal.categories.${c}`)}
                  </button>
                ))}
              </div>
              <Input placeholder={t("journal.messageHint")} value={editing.message ?? ""} onChange={(ev) => setEditing({ ...editing, message: ev.target.value || undefined })} />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {t("journal.save")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  {t("journal.cancel")}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
