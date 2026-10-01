"use client";

import { Loader2, Pause, Play, Radio, Search, Square, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { toLocaleDigits } from "@/components/page-header";
import { normalizeSearch } from "@/components/audio/normalize";
import { PlayerBar, RoundButton } from "@/components/audio/player-bar";
import { useAudio } from "@/components/audio/use-audio";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import type { RadioCategory, RadioStation } from "@/lib/data/radio";

type Filter = "all" | RadioCategory;
const CATEGORIES: RadioCategory[] = ["recitations", "tafsir", "hadith", "athkar", "translations"];

export function RadioBrowser({ stations }: { stations: RadioStation[] }) {
  const t = useTranslations("radio");
  const locale = useLocale();
  const [favorites, setFavorites] = useLocalStorage<string[]>("yusr.radio.favorites", []);
  const [lastUrl, setLastUrl] = useLocalStorage<string | null>("yusr.radio.last", null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Filter>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const audio = useAudio();

  const nameOf = (s: RadioStation) => (locale === "ar" ? s.name : s.nameEn);
  const current = stations.find((s) => s.url === lastUrl) ?? null;
  const favSet = useMemo(() => new Set(favorites), [favorites]);

  // Favourites first, then the remaining matches in catalog order (as in the app).
  const visible = useMemo(() => {
    const q = normalizeSearch(query);
    const starred: RadioStation[] = [];
    const rest: RadioStation[] = [];
    for (const s of stations) {
      const fav = favSet.has(s.url);
      if (favoritesOnly && !fav) continue;
      if (category !== "all" && s.category !== category) continue;
      if (q && ![s.name, s.nameEn, s.slug].some((v) => normalizeSearch(v).includes(q))) continue;
      (fav ? starred : rest).push(s);
    }
    return [...starred, ...rest];
  }, [stations, query, category, favoritesOnly, favSet]);

  const isCurrent = (s: RadioStation) => current?.url === s.url && (audio.playing || audio.loading);

  const playStation = (s: RadioStation) => {
    if (isCurrent(s)) return audio.stop();
    setLastUrl(s.url);
    audio.load(s.url);
  };

  const toggleFavorite = (url: string) =>
    setFavorites((f) => (f.includes(url) ? f.filter((u) => u !== url) : [...f, url]));

  const chips: Filter[] = ["all", ...CATEGORIES];

  return (
    <div className={cn(current && "pb-28")}>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} className="h-11 ps-9" />
      </div>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          type="button"
          onClick={() => setFavoritesOnly((v) => !v)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
            favoritesOnly ? "border-gold bg-gold/15 text-foreground" : "bg-card hover:border-brand/50",
          )}
        >
          <Star className={cn("size-3.5", favoritesOnly ? "fill-gold text-gold" : "text-muted-foreground")} />
          {t("favorites")} ({toLocaleDigits(favorites.length, locale)})
        </button>
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm transition",
              category === c ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-brand/50",
            )}
          >
            {t(c)}
          </button>
        ))}
      </div>

      <p className="mb-3 text-sm text-muted-foreground">{t("count", { n: toLocaleDigits(visible.length, locale) })}</p>

      {visible.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">{favoritesOnly && !query ? t("noFavorites") : t("noResults")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => {
            const active = current?.url === s.url;
            const playing = isCurrent(s);
            const fav = favSet.has(s.url);
            return (
              <div
                key={s.url}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-card p-4 transition hover:border-brand/50",
                  active && "border-brand/60 bg-brand/5",
                )}
              >
                <button
                  type="button"
                  onClick={() => playStation(s)}
                  aria-label={playing ? t("stop") : t("play")}
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-full transition",
                    playing ? "bg-primary text-primary-foreground" : "bg-brand/10 text-brand hover:bg-brand/20",
                  )}
                >
                  {playing && audio.loading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : playing ? (
                    <Square className="size-4 fill-current" />
                  ) : (
                    <Play className="size-5 fill-current" />
                  )}
                </button>
                <button type="button" onClick={() => playStation(s)} className="min-w-0 flex-1 text-start">
                  <p className="truncate font-bold">{nameOf(s)}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {playing && !audio.loading && <span className="size-1.5 animate-pulse rounded-full bg-red-500" />}
                    {playing ? (audio.loading ? t("connecting") : t("live")) : t(s.category)}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(s.url)}
                  aria-label={fav ? t("removeFavorite") : t("addFavorite")}
                  title={fav ? t("removeFavorite") : t("addFavorite")}
                  className="grid size-9 shrink-0 place-items-center rounded-full transition hover:bg-muted"
                >
                  <Star className={cn("size-5", fav ? "fill-gold text-gold" : "text-muted-foreground")} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {current && (
        <PlayerBar>
          <div className="flex items-center gap-3">
            <span className="hero-gradient grid size-11 shrink-0 place-items-center rounded-xl text-gold">
              <Radio className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{nameOf(current)}</p>
              <p className={cn("flex items-center gap-1.5 text-xs", audio.error ? "text-destructive" : "text-muted-foreground")}>
                {audio.error ? (
                  t("error")
                ) : audio.loading ? (
                  t("connecting")
                ) : audio.playing ? (
                  <>
                    <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
                    {t("live")}
                  </>
                ) : (
                  t(current.category)
                )}
              </p>
            </div>
            <RoundButton label={favSet.has(current.url) ? t("removeFavorite") : t("addFavorite")} onClick={() => toggleFavorite(current.url)}>
              <Star className={cn("size-5", favSet.has(current.url) ? "fill-gold text-gold" : "text-muted-foreground")} />
            </RoundButton>
            <RoundButton
              primary
              label={audio.playing ? t("pause") : audio.error ? t("retry") : t("play")}
              onClick={() => (audio.playing ? audio.pause() : audio.load(current.url))}
            >
              {audio.loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : audio.playing ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="size-5 fill-current" />
              )}
            </RoundButton>
            {(audio.playing || audio.loading) && (
              <RoundButton label={t("stop")} onClick={audio.stop}>
                <Square className="size-4 fill-current" />
              </RoundButton>
            )}
          </div>
        </PlayerBar>
      )}
    </div>
  );
}
