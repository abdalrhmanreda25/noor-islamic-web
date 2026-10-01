"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import type { HadithBook } from "@/lib/data/hadith";
import { normalizeArabic } from "./book-search";
import { hadithNo } from "./hadith-card";

/** The books of one collection, filterable by name. */
export function BookList({ collection, books }: { collection: string; books: HadithBook[] }) {
  const t = useTranslations("hadith");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const q = normalizeArabic(query.trim());
  const shown = q
    ? books.filter((b) => normalizeArabic(`${b.nameAr} ${b.nameEn} ${b.id}`).includes(q))
    : books;

  return (
    <>
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchBooks")} className="h-11 ps-9" />
      </div>
      {shown.length === 0 && <p className="py-10 text-center text-muted-foreground">{t("noResults")}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((b) => {
          const name = locale === "ar" ? b.nameAr : b.nameEn || b.nameAr;
          return (
            <Link
              key={b.id}
              href={`/hadith/${collection}/${b.id}`}
              className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:border-brand/50"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-bold text-brand">
                {toLocaleDigits(b.id, locale)}
              </span>
              <div className="min-w-0">
                <p className="line-clamp-2 font-bold" dir="auto">{name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("hadiths", { count: toLocaleDigits(b.count, locale) })}
                  {b.first && b.last && ` · ${hadithNo(b.first, locale)}–${hadithNo(b.last, locale)}`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
