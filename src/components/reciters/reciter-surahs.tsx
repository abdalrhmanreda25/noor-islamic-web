"use client";

import { Download, Loader2, Pause, Play, Repeat, Search, SkipBack, SkipForward, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { toLocaleDigits } from "@/components/page-header";
import { normalizeSearch } from "@/components/audio/normalize";
import { PlayerBar, RoundButton } from "@/components/audio/player-bar";
import { SeekBar } from "@/components/audio/seek-bar";
import { surahUrl } from "@/components/audio/urls";
import { useAudio } from "@/components/audio/use-audio";
import { cn } from "@/lib/utils";
import type { ReciterEntry } from "@/lib/data/reciters";

export type SurahMeta = { number: number; nameShortAr: string; nameEn: string; ayahs: number };

export function ReciterSurahs({ reciter, surahs }: { reciter: ReciterEntry; surahs: SurahMeta[] }) {
  const t = useTranslations("reciters");
  const locale = useLocale();
  const [moshafIndex, setMoshafIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState<number | null>(null);
  const [repeat, setRepeat] = useState(false);

  const moshaf = reciter.moshaf[moshafIndex];
  const available = useMemo(
    () => moshaf.surahs.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i)),
    [moshaf],
  );
  const surahName = (n: number) => {
    const s = surahs[n - 1];
    return locale === "ar" ? `سورة ${s.nameShortAr}` : s.nameEn;
  };
  const reciterName = locale === "ar" ? reciter.name : reciter.nameEn;

  const pos = current == null ? -1 : available.indexOf(current);
  const prev = pos > 0 ? available[pos - 1] : null;
  const next = pos >= 0 && pos < available.length - 1 ? available[pos + 1] : null;

  const audio = useAudio({
    onEnded: () => {
      if (repeat) {
        audio.seek(0);
        audio.play();
      } else if (next != null) playSurah(next);
    },
  });

  function playSurah(n: number) {
    setCurrent(n);
    audio.load(surahUrl(moshaf.server, n));
  }

  const toggle = (n: number) => {
    if (current === n) return audio.playing ? audio.pause() : audio.error ? playSurah(n) : audio.play();
    playSurah(n);
  };

  const visible = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return available;
    return available.filter((n) => {
      const s = surahs[n - 1];
      return String(n) === q || normalizeSearch(s.nameShortAr).includes(q) || normalizeSearch(s.nameEn).includes(q);
    });
  }, [query, available, surahs]);

  const close = () => {
    audio.stop();
    setCurrent(null);
  };

  return (
    <div className={cn(current != null && "pb-36")}>
      {reciter.moshaf.length > 1 && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {reciter.moshaf.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                close();
                setMoshafIndex(i);
              }}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm transition",
                i === moshafIndex ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-brand/50",
              )}
            >
              {locale === "ar" ? m.name : m.nameEn}
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-60">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchSurah")} className="h-11 ps-9" />
        </div>
        <button
          type="button"
          onClick={() => playSurah(available[0])}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/85"
        >
          <Play className="size-4 fill-current" />
          {t("playAll")}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((n) => {
          const active = current === n;
          const playing = active && audio.playing;
          return (
            <div
              key={n}
              className={cn(
                "flex items-center gap-3 rounded-2xl border bg-card p-3 transition hover:border-brand/50",
                active && "border-brand/60 bg-brand/5",
              )}
            >
              <button
                type="button"
                onClick={() => toggle(n)}
                aria-label={playing ? t("pause") : t("play")}
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full transition",
                  active ? "bg-primary text-primary-foreground" : "bg-brand/10 text-brand hover:bg-brand/20",
                )}
              >
                {active && audio.loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : playing ? (
                  <Pause className="size-4 fill-current" />
                ) : (
                  <Play className="size-4 fill-current" />
                )}
              </button>
              <button type="button" onClick={() => toggle(n)} className="min-w-0 flex-1 text-start">
                <p className="truncate font-bold">
                  <span className="me-1.5 text-sm text-gold tabular-nums">{toLocaleDigits(n, locale)}.</span>
                  {surahName(n)}
                </p>
                <p className="text-xs text-muted-foreground">{t("ayahs", { n: toLocaleDigits(surahs[n - 1].ayahs, locale) })}</p>
              </button>
              <a
                href={surahUrl(moshaf.server, n)}
                download
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("download")}
                title={t("download")}
                className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Download className="size-4" />
              </a>
            </div>
          );
        })}
      </div>

      {current != null && (
        <PlayerBar>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{surahName(current)}</p>
              <p className={cn("truncate text-xs", audio.error ? "text-destructive" : "text-muted-foreground")}>
                {audio.error ? t("error") : `${reciterName} · ${t("streaming")}`}
              </p>
            </div>
            <RoundButton label={repeat ? t("repeatOff") : t("repeat")} onClick={() => setRepeat((r) => !r)}>
              <Repeat className={cn("size-4", repeat ? "text-brand" : "text-muted-foreground")} />
            </RoundButton>
            <RoundButton label={t("prev")} disabled={prev == null} onClick={() => prev != null && playSurah(prev)}>
              <SkipBack className="size-5 fill-current rtl:-scale-x-100" />
            </RoundButton>
            <RoundButton primary label={audio.playing ? t("pause") : t("play")} onClick={() => toggle(current)}>
              {audio.loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : audio.playing ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="size-5 fill-current" />
              )}
            </RoundButton>
            <RoundButton label={t("next")} disabled={next == null} onClick={() => next != null && playSurah(next)}>
              <SkipForward className="size-5 fill-current rtl:-scale-x-100" />
            </RoundButton>
            <a
              href={surahUrl(moshaf.server, current)}
              download
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("download")}
              title={t("download")}
              className="hidden size-9 shrink-0 place-items-center rounded-full transition hover:bg-muted sm:grid"
            >
              <Download className="size-4" />
            </a>
            <RoundButton label={t("close")} onClick={close}>
              <X className="size-4 text-muted-foreground" />
            </RoundButton>
          </div>
          <div className="mt-2">
            <SeekBar time={audio.time} duration={audio.duration} onSeek={audio.seek} locale={locale} />
          </div>
        </PlayerBar>
      )}
    </div>
  );
}
