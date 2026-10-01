"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { toLocaleDigits } from "@/components/page-header";
import type { Surah } from "@/lib/data";

// Strip Arabic diacritics and alef variants so "الفاتحه" matches "ٱلْفَاتِحَةِ".
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ً-ٰٟۖ-ۭ]/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[-'\s]/g, "");

export function SurahList({ surahs }: { surahs: Surah[] }) {
  const t = useTranslations("quran");
  const locale = useLocale();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return surahs;
    return surahs.filter(
      (s) =>
        String(s.number) === q ||
        normalize(s.nameAr).includes(q) ||
        normalize(s.nameEn).includes(q) ||
        normalize(s.translationEn).includes(q),
    );
  }, [query, surahs]);

  return (
    <>
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          className="h-11 ps-9"
        />
      </div>
      {filtered.length === 0 && <p className="text-center text-muted-foreground">{t("noResults")}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <Link
            key={s.number}
            href={`/quran/page/${s.startPage}`}
            className="flex items-center gap-4 rounded-xl border bg-card p-4 transition hover:border-brand/50 hover:shadow-sm"
          >
            <span className="grid size-10 shrink-0 rotate-45 place-items-center rounded-lg border-2 border-gold/60">
              <span className="-rotate-45 text-sm font-bold">{toLocaleDigits(s.number, locale)}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{locale === "ar" ? `سورة ${s.nameShortAr}` : s.nameEn}</p>
              <p className="text-xs text-muted-foreground">
                {locale === "en" && `${s.translationEn} · `}
                {t(s.type)} · {t("ayahs", { count: toLocaleDigits(s.ayahs, locale) })}
              </p>
            </div>
            <span className="quran-text text-xl text-brand" dir="rtl">{s.nameShortAr}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
