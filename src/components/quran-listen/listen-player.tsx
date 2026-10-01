"use client";

import { CheckCircle2, Loader2, Pause, Play, RotateCcw, SkipBack, SkipForward, Square } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { PlayerBar, RoundButton } from "@/components/audio/player-bar";
import { everyAyahUrl } from "@/components/audio/urls";
import { useAudio } from "@/components/audio/use-audio";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import type { AyahReciter } from "@/lib/data/quran-listen";

const BASMALA = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ";
const INFINITE = -1;
const REPEATS = [1, 2, 3, 5, 7, 10, INFINITE];
const DEFAULT_RECITER = "Alafasy_128kbps";

type Phase = "idle" | "playing" | "finished";

const selectClass = "h-10 w-full min-w-0 rounded-lg border bg-card px-2 text-sm";

export function ListenPlayer({
  surah,
  ayahs,
  reciters,
}: {
  surah: number;
  ayahs: { n: number; text: string }[];
  reciters: AyahReciter[];
}) {
  const t = useTranslations("quran-listen");
  const locale = useLocale();
  const [reciterId, setReciterId] = useLocalStorage("yusr.quran-listen.reciter", DEFAULT_RECITER);
  const [repeat, setRepeat] = useLocalStorage("yusr.quran-listen.repeat", 1);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(ayahs.length);
  const [phase, setPhase] = useState<Phase>("idle");
  const [current, setCurrent] = useState(1);
  const [pass, setPass] = useState(1);

  const reciter = reciters.find((r) => r.id === reciterId) ?? reciters[0];
  const url = (n: number) => everyAyahUrl(reciter.id, surah, n);

  const audio = useAudio({
    onEnded: () => {
      if (current < to) return playAt(current + 1);
      if (repeat === INFINITE || pass < repeat) {
        setPass((p) => p + 1);
        return playAt(from);
      }
      setPhase("finished");
    },
  });

  function playAt(n: number) {
    setCurrent(n);
    setPhase("playing");
    audio.load(url(n));
    if (n < to) audio.preload(url(n + 1));
  }

  const start = (n = from) => {
    setPass(1);
    playAt(n);
  };

  const stop = () => {
    audio.stop();
    setPhase("idle");
  };

  // Keep the recited ayah in view, like the app's auto-scrolling page.
  useEffect(() => {
    if (phase !== "playing") return;
    document.getElementById(`listen-ayah-${current}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [current, phase]);

  const repeatLabel = (n: number) =>
    n === INFINITE ? t("repeatInfinite") : n === 1 ? t("repeatOnce") : n === 2 ? t("repeatTwice") : t("repeatN", { n: toLocaleDigits(n, locale) });

  const active = phase !== "idle";
  const ayahOptions = (min: number, max: number) =>
    ayahs
      .filter((a) => a.n >= min && a.n <= max)
      .map((a) => (
        <option key={a.n} value={a.n}>
          {toLocaleDigits(a.n, locale)}
        </option>
      ));

  return (
    <div className={cn(active && "pb-32")}>
      <section className="mb-6 rounded-2xl border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm font-medium lg:col-span-2">
            {t("reciter")}
            <select
              value={reciter.id}
              onChange={(e) => {
                stop();
                setReciterId(e.target.value);
              }}
              className={cn(selectClass, "mt-1.5")}
            >
              {reciters.map((r) => (
                <option key={r.id} value={r.id}>
                  {locale === "ar" ? r.name : r.nameEn}
                </option>
              ))}
            </select>
          </label>
          <div className="text-sm font-medium">
            {t("range")}
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("from")}</span>
              <select
                aria-label={t("from")}
                value={from}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  stop();
                  setFrom(v);
                  if (to < v) setTo(v);
                }}
                className={selectClass}
              >
                {ayahOptions(1, ayahs.length)}
              </select>
              <span className="text-xs text-muted-foreground">{t("to")}</span>
              <select
                aria-label={t("to")}
                value={to}
                onChange={(e) => {
                  stop();
                  setTo(Number(e.target.value));
                }}
                className={selectClass}
              >
                {ayahOptions(from, ayahs.length)}
              </select>
            </div>
          </div>
          <label className="block text-sm font-medium">
            {t("repeat")}
            <select value={repeat} onChange={(e) => setRepeat(Number(e.target.value))} className={cn(selectClass, "mt-1.5")}>
              {REPEATS.map((n) => (
                <option key={n} value={n}>
                  {repeatLabel(n)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {t("ayahMode")} · {t("tapHint")}
          </p>
          <button
            type="button"
            onClick={() => start()}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground shadow-md transition hover:bg-primary/85"
          >
            <Play className="size-4 fill-current" />
            {t("start")}
          </button>
        </div>
      </section>

      {phase === "finished" && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/40 bg-brand/10 p-4">
          <p className="flex items-center gap-2 font-bold text-brand">
            <CheckCircle2 className="size-5" />
            {t("finished")}
          </p>
          <button
            type="button"
            onClick={() => start()}
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:border-brand/50"
          >
            <RotateCcw className="size-4" />
            {t("replay")}
          </button>
        </div>
      )}

      <div dir="rtl" className="rounded-2xl border bg-card p-3 sm:p-5">
        {surah !== 1 && surah !== 9 && <p className="quran-text mb-4 text-center text-3xl">{BASMALA}</p>}
        <div className="space-y-1">
          {ayahs.map((a) => {
            const inRange = a.n >= from && a.n <= to;
            const isCurrent = active && a.n === current;
            return (
              <button
                key={a.n}
                id={`listen-ayah-${a.n}`}
                type="button"
                onClick={() => {
                  if (!inRange) {
                    setFrom(a.n);
                    if (to < a.n) setTo(ayahs.length);
                  }
                  start(a.n);
                }}
                className={cn(
                  "block w-full scroll-mt-32 rounded-xl border border-transparent px-3 py-2 text-start transition hover:bg-muted/60",
                  !inRange && "opacity-45",
                  isCurrent && "border-gold/60 bg-gold/15 hover:bg-gold/20",
                )}
              >
                <span className="quran-text text-2xl sm:text-[1.75rem]">
                  {a.text} <span className="ayah-marker whitespace-nowrap">﴿{toLocaleDigits(a.n, "ar")}﴾</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {active && (
        <PlayerBar>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">
                {phase === "finished" ? t("finished") : t("currentAyah", { n: toLocaleDigits(current, locale) })}
              </p>
              <p className={cn("truncate text-xs", audio.error ? "text-destructive" : "text-muted-foreground")}>
                {audio.error
                  ? t("error")
                  : audio.loading
                    ? t("loading")
                    : `${locale === "ar" ? reciter.name : reciter.nameEn} · ${
                        repeat === INFINITE
                          ? t("passInfinite", { n: toLocaleDigits(pass, locale) })
                          : t("pass", { n: toLocaleDigits(pass, locale), total: toLocaleDigits(repeat, locale) })
                      }`}
              </p>
            </div>
            <RoundButton label={t("prev")} disabled={current <= from} onClick={() => playAt(current - 1)}>
              <SkipBack className="size-5 fill-current rtl:-scale-x-100" />
            </RoundButton>
            <RoundButton
              primary
              label={audio.playing ? t("pause") : audio.error ? t("retry") : t("resume")}
              onClick={() => {
                if (phase === "finished") return start();
                if (audio.error) return playAt(current);
                if (audio.playing) audio.pause();
                else audio.play();
              }}
            >
              {audio.loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : audio.playing ? (
                <Pause className="size-5 fill-current" />
              ) : phase === "finished" ? (
                <RotateCcw className="size-5" />
              ) : (
                <Play className="size-5 fill-current" />
              )}
            </RoundButton>
            <RoundButton label={t("next")} disabled={current >= to} onClick={() => playAt(current + 1)}>
              <SkipForward className="size-5 fill-current rtl:-scale-x-100" />
            </RoundButton>
            <RoundButton label={t("stop")} onClick={stop}>
              <Square className="size-4 fill-current" />
            </RoundButton>
          </div>
        </PlayerBar>
      )}
    </div>
  );
}
