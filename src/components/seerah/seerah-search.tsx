"use client";

import { Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import type { SeerahSearchEntry } from "@/lib/data/seerah";
import { cn } from "@/lib/utils";
import { ACCENT, excerpt, lessonHref, normalizeArabic, type LessonLink } from "./shared";

const LIMIT = 60;

/** Client-side search across all lessons: every word must match; title hits first (the app's SeerahSearchIndex). */
export function SeerahSearch({ entries, lessons }: { entries: SeerahSearchEntry[]; lessons: Record<string, LessonLink> }) {
  const t = useTranslations("seerah");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) setQuery(q);
  }, []);

  const index = useMemo(
    () => entries.map(([id, title, body]) => ({ id, body, nTitle: normalizeArabic(title), nBody: normalizeArabic(body) })),
    [entries],
  );

  const hits = useMemo(() => {
    const terms = normalizeArabic(deferred).split(/\s+/).filter((x) => x.length > 1);
    if (!terms.length) return null;
    const inTitle: { id: string; snippet: string | null }[] = [];
    const inBody: { id: string; snippet: string | null }[] = [];
    for (const e of index) {
      if (!terms.every((x) => e.nTitle.includes(x) || e.nBody.includes(x))) continue;
      if (terms.every((x) => e.nTitle.includes(x))) {
        inTitle.push({ id: e.id, snippet: null });
        continue;
      }
      const line = e.body.split("\n").find((x) => normalizeArabic(x).includes(terms[0])) ?? e.body;
      inBody.push({ id: e.id, snippet: excerpt(line, terms[0]) });
    }
    return [...inTitle, ...inBody];
  }, [deferred, index]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 rounded-2xl border bg-card px-4 focus-within:border-brand/60">
        <Search className={cn("size-5 shrink-0", ACCENT)} />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          dir="auto"
          className="min-w-0 flex-1 bg-transparent py-3.5 outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="×" className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        )}
      </div>

      {hits === null ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t("searchHint")}</p>
      ) : hits.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t("noResults", { query: deferred.trim() })}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t("results", { n: hits.length, count: toLocaleDigits(hits.length, locale) })}</p>
          <ul className="grid gap-2.5" dir="rtl">
            {hits.slice(0, LIMIT).map(({ id, snippet }) => {
              const l = lessons[id];
              if (!l) return null;
              return (
                <li key={id}>
                  <Link href={lessonHref(l)} className="block rounded-2xl border bg-card p-4 transition hover:border-brand/50">
                    <p className={cn("font-extrabold", ACCENT)}>{l.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {l.chapterTitle}
                      {!snippet && <span className="ms-2 rounded-full bg-secondary px-2 py-0.5">{t("inTitle")}</span>}
                    </p>
                    {snippet && <p className="mt-2 line-clamp-3 text-sm leading-relaxed">{snippet}</p>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
