"use client";

import { Bookmark, BookmarkCheck, CircleCheck, RotateCcw, Search, Shield } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";

/** Chapter numbers (1-based) the user marked as read / saved; last opened chapter. */
export const HISN_READ_KEY = "yusr.muslim-fortress.read";
export const HISN_FAVORITES_KEY = "yusr.muslim-fortress.favorites";
export const HISN_LAST_KEY = "yusr.muslim-fortress.last";

export type ChapterSummary = { n: number; title: string; count: number; text: string };

const FILTERS = ["all", "favorites", "unread", "read"] as const;

const norm = (s: string) =>
  s
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");

/** Port of the MuslimFortress screen: progress card, search, filters, chapters. */
export function FortressList({ chapters }: { chapters: ChapterSummary[] }) {
  const t = useTranslations("muslim-fortress");
  const locale = useLocale();
  const [read, setRead] = useLocalStorage<number[]>(HISN_READ_KEY, []);
  const [favorites, setFavorites] = useLocalStorage<number[]>(HISN_FAVORITES_KEY, []);
  const [last] = useLocalStorage<number | null>(HISN_LAST_KEY, null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const n = (v: number) => toLocaleDigits(v, locale);

  const readSet = new Set(read);
  const favSet = new Set(favorites);
  const q = norm(query.trim());
  const shown = chapters.filter(
    (c) =>
      (filter === "all" ||
        (filter === "favorites" && favSet.has(c.n)) ||
        (filter === "unread" && !readSet.has(c.n)) ||
        (filter === "read" && readSet.has(c.n))) &&
      (!q || norm(c.title).includes(q) || norm(c.text).includes(q)),
  );
  const lastChapter = chapters.find((c) => c.n === last);
  const readCount = chapters.filter((c) => readSet.has(c.n)).length;

  return (
    <div className="space-y-5">
      <section className="hero-gradient rounded-2xl p-5 text-white sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Shield className="size-9 text-gold" />
            <div>
              <p className="text-lg font-bold">
                {readCount === chapters.length
                  ? t("allRead")
                  : t("readProgress", { read: n(readCount), total: n(chapters.length) })}
              </p>
              <p className="text-sm text-white/70">{t("progressHint")}</p>
            </div>
          </div>
          {readCount > 0 && (
            <button
              type="button"
              onClick={() => confirm(t("resetConfirm")) && setRead([])}
              title={t("reset")}
              aria-label={t("reset")}
              className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="size-4" />
            </button>
          )}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full bg-gold transition-all" style={{ width: `${(readCount / chapters.length) * 100}%` }} />
        </div>
        {lastChapter && (
          <Link
            href={`/muslim-fortress/${lastChapter.n}`}
            className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white/10 px-4 py-3 hover:bg-white/15"
          >
            <span className="min-w-0">
              <span className="block text-xs text-gold">{t("continue")}</span>
              <span className="block truncate font-semibold" dir="rtl">
                {lastChapter.title}
              </span>
            </span>
          </Link>
        )}
      </section>

      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-11 rounded-xl bg-card ps-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition",
              filter === f ? "border-brand bg-brand text-white" : "bg-card hover:border-brand/50",
            )}
          >
            {t(`filters.${f}`)}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
          {q ? t("noResults") : filter === "favorites" ? t("noFavorites") : t("empty")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => {
            const isRead = readSet.has(c.n);
            const isFav = favSet.has(c.n);
            return (
              <div
                key={c.n}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-card p-4 transition hover:border-brand/50",
                  isRead && "bg-secondary/50",
                )}
              >
                <Link href={`/muslim-fortress/${c.n}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold",
                      isRead ? "bg-brand text-white" : "bg-brand/10 text-brand",
                    )}
                  >
                    {isRead ? <CircleCheck className="size-5" /> : n(c.n)}
                  </span>
                  <span className="min-w-0" dir="rtl">
                    <span className="block font-bold leading-snug">{c.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {isRead ? t("done") : t("items", { count: c.count, n: n(c.count) })}
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setFavorites((f) => (f.includes(c.n) ? f.filter((x) => x !== c.n) : [...f, c.n]))}
                  aria-label={isFav ? t("unfavorite") : t("favorite")}
                  title={isFav ? t("unfavorite") : t("favorite")}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                >
                  {isFav ? <BookmarkCheck className="size-5 text-gold" /> : <Bookmark className="size-5" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
