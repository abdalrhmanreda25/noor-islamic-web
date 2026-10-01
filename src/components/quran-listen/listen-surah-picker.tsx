"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { toLocaleDigits } from "@/components/page-header";
import { normalizeSearch } from "@/components/audio/normalize";
import type { Surah } from "@/lib/data";

export function ListenSurahPicker({ surahs }: { surahs: Surah[] }) {
  const t = useTranslations("quran-listen");
  const locale = useLocale();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return surahs;
    return surahs.filter(
      (s) => String(s.number) === q || normalizeSearch(s.nameShortAr).includes(q) || normalizeSearch(s.nameEn).includes(q),
    );
  }, [query, surahs]);

  return (
    <>
      <h2 className="mb-3 text-lg font-bold">{t("chooseSurah")}</h2>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} className="h-11 ps-9" />
      </div>
      {visible.length === 0 && <p className="py-10 text-center text-muted-foreground">{t("noResults")}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((s) => (
          <Link
            key={s.number}
            href={`/quran/listen/${s.number}`}
            className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:border-brand/50 hover:shadow-sm"
          >
            <span className="grid size-10 shrink-0 rotate-45 place-items-center rounded-lg border-2 border-gold/60">
              <span className="-rotate-45 text-sm font-bold">{toLocaleDigits(s.number, locale)}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{locale === "ar" ? `سورة ${s.nameShortAr}` : s.nameEn}</p>
              <p className="text-xs text-muted-foreground">{t("ayahs", { count: toLocaleDigits(s.ayahs, locale) })}</p>
            </div>
            <span className="quran-text text-xl text-brand" dir="rtl">{s.nameShortAr}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
