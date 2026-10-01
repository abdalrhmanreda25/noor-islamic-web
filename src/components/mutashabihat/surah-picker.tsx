"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { toLocaleDigits } from "@/components/page-header";

export type MutashabihSurahRow = { surah: number; nameAr: string; nameEn: string; ayat: number; matches: number };

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ً-ٰٟۖ-ۭ]/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[-'\s]/g, "");

export function MutashabihSurahPicker({ rows }: { rows: MutashabihSurahRow[] }) {
  const t = useTranslations("mutashabihat");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = normalize(query);
    return q
      ? rows.filter((r) => String(r.surah) === q || normalize(r.nameAr).includes(q) || normalize(r.nameEn).includes(q))
      : rows;
  }, [query, rows]);

  return (
    <>
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchSurah")} className="h-11 ps-9" />
      </div>
      {filtered.length === 0 && <p className="py-6 text-center text-muted-foreground">{t("noResults")}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <Link
            key={r.surah}
            href={`/mutashabihat/${r.surah}`}
            className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:border-brand/50 hover:shadow-sm"
          >
            <span className="grid size-10 shrink-0 rotate-45 place-items-center rounded-lg border-2 border-gold/60">
              <span className="-rotate-45 text-sm font-bold">{toLocaleDigits(r.surah, locale)}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{locale === "ar" ? `سورة ${r.nameAr}` : r.nameEn}</p>
              <p className="text-xs text-muted-foreground">
                {t("ayatCount", { count: r.ayat, n: toLocaleDigits(r.ayat, locale) })} · {t("matchesCount", { count: r.matches, n: toLocaleDigits(r.matches, locale) })}
              </p>
            </div>
            <span className="quran-text text-xl text-brand" dir="rtl">{r.nameAr}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
