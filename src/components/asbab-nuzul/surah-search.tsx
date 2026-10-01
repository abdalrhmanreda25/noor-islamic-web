"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { toLocaleDigits } from "@/components/page-header";

export type AsbabSurahRow = { surah: number; nameAr: string; nameEn: string; entries: number; ayat: number };
type Entry = [number, number, number, string];

const MAX_HITS = 50;

/** Drops tashkeel and unifies letter forms so plain typing matches the narrations. */
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));

export function AsbabSurahSearch({ rows }: { rows: AsbabSurahRow[] }) {
  const t = useTranslations("asbab-nuzul");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const q = normalize(query.trim());

  // The narration texts are fetched only once the user searches.
  const requested = useRef(false);
  useEffect(() => {
    if (q.length < 2 || requested.current) return;
    requested.current = true;
    fetch(`/${locale}/asbab-nuzul/search`)
      .then((r) => r.json())
      .then((data: Entry[]) => setEntries(data))
      .catch(() => {
        requested.current = false;
      });
  }, [q, locale]);

  const surahHits = useMemo(
    () =>
      q
        ? rows.filter((r) => String(r.surah) === q || normalize(r.nameAr).includes(q) || normalize(r.nameEn).includes(q))
        : rows,
    [q, rows],
  );

  const textHits = useMemo(() => {
    if (q.length < 2 || !entries) return [];
    const hits: { entry: Entry; excerpt: string }[] = [];
    for (const entry of entries) {
      const norm = normalize(entry[3]);
      const i = norm.indexOf(q);
      if (i < 0) continue;
      // Map back roughly: the normalized text is shorter, so excerpt from it.
      const start = Math.max(0, i - 60);
      hits.push({ entry, excerpt: `${start > 0 ? "…" : ""}${norm.slice(start, i + q.length + 80)}…` });
      if (hits.length >= MAX_HITS) break;
    }
    return hits;
  }, [q, entries]);

  const name = (n: number) => {
    const r = rows.find((x) => x.surah === n);
    return r ? (locale === "ar" ? `سورة ${r.nameAr}` : r.nameEn) : String(n);
  };
  const range = (from: number, to: number) =>
    from === to
      ? t("ayah", { n: toLocaleDigits(from, locale) })
      : t("ayahRange", { from: toLocaleDigits(from, locale), to: toLocaleDigits(to, locale) });

  return (
    <>
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} className="h-11 ps-9" />
      </div>

      {q && surahHits.length === 0 && textHits.length === 0 && (entries || q.length < 2) && (
        <div className="py-8 text-center">
          <p className="font-bold">{t("noResults")}</p>
          <p className="text-sm text-muted-foreground">{t("noResultsHint")}</p>
        </div>
      )}

      {surahHits.length > 0 && (
        <>
          {q && <h3 className="mb-2 text-sm font-bold text-muted-foreground">{t("surahs")}</h3>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {surahHits.map((r) => (
              <Link
                key={r.surah}
                href={`/asbab-nuzul/surah/${r.surah}`}
                className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:border-brand/50 hover:shadow-sm"
              >
                <span className="grid size-10 shrink-0 rotate-45 place-items-center rounded-lg border-2 border-gold/60">
                  <span className="-rotate-45 text-sm font-bold">{toLocaleDigits(r.surah, locale)}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{name(r.surah)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("entries", { count: r.entries, n: toLocaleDigits(r.entries, locale) })} · {t("ayat", { count: r.ayat, n: toLocaleDigits(r.ayat, locale) })}
                  </p>
                </div>
                <span className="quran-text text-xl text-brand" dir="rtl">{r.nameAr}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {q.length >= 2 && !entries && <p className="mt-6 text-center text-sm text-muted-foreground">{t("searching")}</p>}

      {textHits.length > 0 && (
        <>
          <h3 className="mb-2 mt-6 text-sm font-bold text-muted-foreground">
            {textHits.length >= MAX_HITS
              ? t("inNarrationsCapped", { count: toLocaleDigits(MAX_HITS, locale) })
              : t("inNarrations", { count: toLocaleDigits(textHits.length, locale) })}
          </h3>
          <div className="space-y-2">
            {textHits.map(({ entry: [s, from, to], excerpt }) => (
              <Link
                key={`${s}-${from}-${to}`}
                href={`/asbab-nuzul/surah/${s}#ayah-${from}`}
                className="block rounded-2xl border bg-card p-4 transition hover:border-brand/50"
              >
                <p className="text-sm font-bold text-brand">
                  {name(s)} · {range(from, to)}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground" dir="rtl">{excerpt}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
