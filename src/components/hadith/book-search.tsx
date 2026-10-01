"use client";

import { Search, X } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useDeferredValue, useEffect, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { toLocaleDigits } from "@/components/page-header";
import type { Hadith } from "@/lib/data/hadith";
import { HadithCard } from "./hadith-card";

const MAX_RESULTS = 100;

/** Strips tashkeel and unifies letter forms so plain typing matches vocalized text. */
export const normalizeArabic = (s: string) =>
  s
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase();

/**
 * Client-side search over a whole book. The book is fetched once, on the first
 * query, from the static JSON route; while the query is empty the server-rendered
 * page (children) is shown.
 */
export function BookSearch({
  url,
  gradedBy,
  source,
  children,
}: {
  url: string;
  gradedBy?: string;
  source: string;
  children: ReactNode;
}) {
  const t = useTranslations("hadith");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [book, setBook] = useState<(Hadith & { norm: string })[] | null>(null);
  const [failed, setFailed] = useState(false);
  const q = useDeferredValue(query.trim());

  useEffect(() => {
    if (!q || book) return;
    let alive = true;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((list: Hadith[]) => {
        if (alive) setBook(list.map((h) => ({ ...h, norm: normalizeArabic(`${h.ar} ${h.en ?? ""}`) })));
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [q, book, url]);

  const results = (() => {
    if (!q || !book) return [];
    const digits = q.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
    if (/^\d+$/.test(digits)) return book.filter((h) => h.number?.split(/\D+/).includes(digits));
    const words = normalizeArabic(q).split(/\s+/);
    return book.filter((h) => words.every((w) => h.norm.includes(w)));
  })();

  return (
    <>
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchHadith")}
          className="h-11 pe-9 ps-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="clear"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {!q ? (
        children
      ) : !book ? (
        <p className="py-10 text-center text-muted-foreground">{failed ? t("noResults") : t("searching")}</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {results.length ? t("results", { count: toLocaleDigits(results.length, locale) }) : t("noResults")}
          </p>
          {results.slice(0, MAX_RESULTS).map((h, i) => (
            <HadithCard key={`${h.number}-${i}`} hadith={h} gradedBy={gradedBy} source={source} />
          ))}
          {results.length > MAX_RESULTS && (
            <p className="text-center text-sm text-muted-foreground">
              {t("moreResults", { count: toLocaleDigits(MAX_RESULTS, locale) })}
            </p>
          )}
        </div>
      )}
    </>
  );
}
