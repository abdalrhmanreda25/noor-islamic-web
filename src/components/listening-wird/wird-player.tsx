"use client";

import { CheckCircle2, Flame, Headphones, ListOrdered, Loader2, Mic, Minus, Pause, Play, Plus, RotateCcw, Square } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { PlayerBar } from "@/components/audio/player-bar";
import { everyAyahUrl } from "@/components/audio/urls";
import { useAudio } from "@/components/audio/use-audio";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import type { AyahReciter } from "@/lib/data/quran-listen";

type SurahMeta = { number: number; nameShortAr: string; nameEn: string; ayahs: number };
type Progress = { date: string; key: string; heard: number[] };

const MIN = 1;
const MAX = 30;

const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Small seeded PRNG (mulberry32): the same date always draws the same wird. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return (max: number) => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * max);
  };
}

/** One surah, one contiguous passage, and a reciter, all drawn from the date (as in the app). */
function selectionFor(date: Date, count: number, surahs: SurahMeta[], reciters: AyahReciter[], pinned: string | null) {
  const rand = seeded(date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate());
  // Drawn even when a reciter is pinned so pinning does not shift the passage.
  const drawn = reciters[rand(reciters.length)];
  const reciter = reciters.find((r) => r.id === pinned) ?? drawn;
  const eligible = surahs.filter((s) => s.ayahs >= count);
  const surah = eligible[rand(eligible.length)];
  const start = rand(surah.ayahs - count + 1) + 1;
  return { reciter, surah, start, end: start + count - 1 };
}

function streakOf(days: string[], today: Date) {
  const set = new Set(days);
  const d = new Date(today);
  if (!set.has(dateKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(dateKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function WirdPlayer({ surahs, reciters }: { surahs: SurahMeta[]; reciters: AyahReciter[] }) {
  const t = useTranslations("listening-wird");
  const locale = useLocale();
  const [count, setCount] = useLocalStorage("yusr.listening-wird.count", 5);
  const [pinned, setPinned] = useLocalStorage<string | null>("yusr.listening-wird.reciter", null);
  const [progress, setProgress] = useLocalStorage<Progress | null>("yusr.listening-wird.progress", null);
  const [days, setDays] = useLocalStorage<string[]>("yusr.listening-wird.days", []);
  const [today, setToday] = useState<Date | null>(null);
  const [text, setText] = useState<{ surah: number; ayahs: { n: number; text: string }[] } | null>(null);
  const [textError, setTextError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);

  // The date is read after mount so server and client render the same markup.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(new Date());
  }, []);

  const safeCount = Math.min(MAX, Math.max(MIN, count));
  const sel = useMemo(
    () => (today ? selectionFor(today, safeCount, surahs, reciters, pinned) : null),
    [today, safeCount, surahs, reciters, pinned],
  );
  const todayKey = today ? dateKey(today) : "";
  const selKey = sel ? `${sel.surah.number}:${sel.start}-${sel.end}` : "";
  const heard = useMemo(
    () => new Set(progress && progress.date === todayKey && progress.key === selKey ? progress.heard : []),
    [progress, todayKey, selKey],
  );

  const surahNumber = sel?.surah.number;
  useEffect(() => {
    if (!surahNumber) return;
    let cancelled = false;
    fetch(`/${locale}/listening-wird/text/${surahNumber}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((ayahs) => !cancelled && setText({ surah: surahNumber, ayahs }))
      .catch(() => !cancelled && setTextError(true));
    return () => {
      cancelled = true;
    };
  }, [surahNumber, locale]);

  const ayat = sel && text?.surah === sel.surah.number ? text.ayahs.filter((a) => a.n >= sel.start && a.n <= sel.end) : [];
  const url = (n: number) => (sel ? everyAyahUrl(sel.reciter.id, sel.surah.number, n) : "");

  const markHeard = (n: number) => {
    if (!sel) return;
    const next = [...new Set([...heard, n])];
    setProgress({ date: todayKey, key: selKey, heard: next });
    if (next.length >= sel.end - sel.start + 1 && !days.includes(todayKey)) setDays((d) => [...d, todayKey]);
  };

  const audio = useAudio({
    onEnded: () => {
      if (!sel) return;
      const n = sel.start + index;
      markHeard(n);
      if (n < sel.end) playIndex(index + 1);
      else setPlaying(false);
    },
  });

  function playIndex(i: number) {
    if (!sel) return;
    setIndex(i);
    setPlaying(true);
    audio.load(url(sel.start + i));
    if (sel.start + i < sel.end) audio.preload(url(sel.start + i + 1));
  }

  const stop = () => {
    audio.stop();
    setPlaying(false);
  };

  // A changed count or reciter is a different wird: stop the old one first.
  const changeCount = (n: number) => {
    stop();
    setCount(Math.min(MAX, Math.max(MIN, n)));
  };

  useEffect(() => {
    if (playing) document.getElementById(`wird-ayah-${index}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [index, playing]);

  const total = sel ? sel.end - sel.start + 1 : safeCount;
  const done = heard.size;
  const complete = sel != null && done >= total;
  const streak = today ? streakOf(days, today) : 0;
  const nameOf = (r: AyahReciter) => (locale === "ar" ? r.name : r.nameEn);
  const surahName = sel ? (locale === "ar" ? sel.surah.nameShortAr : sel.surah.nameEn) : "";

  return (
    <div className="pb-28">
      <section className="hero-gradient mb-4 flex items-center gap-4 rounded-2xl p-5 text-white shadow-xl shadow-primary/20">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-gold">
          <Headphones className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">{t("today", { count: t("count", { n: safeCount, d: toLocaleDigits(safeCount, locale) }) })}</p>
          <p className="truncate text-sm text-white/75">{sel ? t("byReciter", { name: nameOf(sel.reciter) }) : " "}</p>
          {sel && (
            <p className="mt-1 text-xs text-gold">
              {t("reference", {
                surah: surahName,
                from: toLocaleDigits(sel.start, locale),
                to: toLocaleDigits(sel.end, locale),
              })}
            </p>
          )}
        </div>
      </section>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4">
          <p className="mb-2 flex items-center justify-between text-sm">
            <span>{t("progress", { done: toLocaleDigits(done, locale), total: toLocaleDigits(total, locale) })}</span>
            {complete && <CheckCircle2 className="size-4 text-brand" />}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(done / total) * 100}%` }} />
          </div>
          {complete && <p className="mt-2 text-sm font-bold text-brand">{t("completed")}</p>}
          {done > 0 && !complete && (
            <button
              type="button"
              onClick={() => setProgress(null)}
              className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3" />
              {t("reset")}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
          <span className="grid size-10 place-items-center rounded-full bg-gold/15 text-gold">
            <Flame className="size-5" />
          </span>
          <div>
            <p className="font-bold">{t("streak", { n: streak, d: toLocaleDigits(streak, locale) })}</p>
            <p className="text-xs text-muted-foreground">{t("totalDays", { n: toLocaleDigits(days.length, locale) })}</p>
          </div>
        </div>
      </div>

      <section className="mb-4 rounded-2xl border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <ListOrdered className="size-5 shrink-0 text-brand" />
          <span className="flex-1 text-sm font-bold">{t("ayahCount")}</span>
          <button
            type="button"
            aria-label="-"
            disabled={safeCount <= MIN}
            onClick={() => changeCount(safeCount - 1)}
            className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand disabled:opacity-30"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center font-bold text-brand tabular-nums">{toLocaleDigits(safeCount, locale)}</span>
          <button
            type="button"
            aria-label="+"
            disabled={safeCount >= MAX}
            onClick={() => changeCount(safeCount + 1)}
            className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand disabled:opacity-30"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="my-3 border-t" />
        <label className="flex items-center gap-3">
          <Mic className="size-5 shrink-0 text-brand" />
          <span className="text-sm font-bold">{t("reciter")}</span>
          <select
            value={pinned ?? ""}
            onChange={(e) => {
              stop();
              setPinned(e.target.value || null);
            }}
            className="h-9 min-w-0 flex-1 rounded-lg border bg-card px-2 text-sm"
          >
            <option value="">{t("random")}</option>
            {reciters.map((r) => (
              <option key={r.id} value={r.id}>
                {nameOf(r)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section dir="rtl" className="rounded-2xl border bg-card p-4 sm:p-6">
        {textError ? (
          <p className="text-center text-sm text-destructive">{t("textError")}</p>
        ) : !ayat.length ? (
          <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("loadingText")}
          </p>
        ) : (
          <p className="quran-text text-justify text-2xl sm:text-[1.75rem]">
            {ayat.map((a, i) => {
              const current = playing && i === index;
              return (
                <span
                  key={a.n}
                  id={`wird-ayah-${i}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => playIndex(i)}
                  onKeyDown={(e) => e.key === "Enter" && playIndex(i)}
                  className={cn(
                    "cursor-pointer scroll-mt-32 rounded-md transition hover:bg-muted/60",
                    heard.has(a.n) && !current && "text-brand",
                    current && "bg-gold/20",
                  )}
                >
                  {a.text} <span className="ayah-marker whitespace-nowrap">﴿{toLocaleDigits(a.n, "ar")}﴾</span>{" "}
                </span>
              );
            })}
          </p>
        )}
      </section>

      <PlayerBar>
        {audio.error && playing && <p className="mb-2 text-center text-xs text-destructive">{t("error")}</p>}
        <div className="flex items-center gap-2">
          {playing && (
            <button
              type="button"
              onClick={() => (audio.playing ? audio.pause() : audio.error ? playIndex(index) : audio.play())}
              aria-label={audio.playing ? t("pause") : t("resume")}
              className="grid size-12 shrink-0 place-items-center rounded-2xl border bg-card transition hover:border-brand/50"
            >
              {audio.loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : audio.playing ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="size-5 fill-current" />
              )}
            </button>
          )}
          <button
            type="button"
            disabled={!ayat.length}
            onClick={() => (playing ? stop() : playIndex(complete ? 0 : Math.max(0, ayat.findIndex((a) => !heard.has(a.n)))))}
            className={cn(
              "inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl font-bold shadow-md transition disabled:opacity-50",
              playing ? "bg-destructive text-white hover:bg-destructive/85" : "bg-primary text-primary-foreground hover:bg-primary/85",
            )}
          >
            {playing ? <Square className="size-4 fill-current" /> : <Play className="size-5 fill-current" />}
            {playing ? t("stop") : t("play")}
          </button>
        </div>
      </PlayerBar>
    </div>
  );
}
