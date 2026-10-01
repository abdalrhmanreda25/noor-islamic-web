"use client";

import { BookOpenText, Check, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { toLocaleDigits } from "@/components/page-header";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Surah } from "@/lib/data";
import { BOOK_KEY, DEFAULT_BOOK, TAFSIR_BOOKS, isTafsirBook, tafseerHref } from "./books";

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ً-ٰٟۖ-ۭ]/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[-'\s]/g, "");

/** Book picker + searchable surah list; links open the surah in the chosen book. */
export function TafseerBrowser({ surahs }: { surahs: Surah[] }) {
  const t = useTranslations("tafseer");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [stored, setBook] = useLocalStorage<string>(BOOK_KEY, DEFAULT_BOOK);
  const book = isTafsirBook(stored) ? stored : DEFAULT_BOOK;

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return surahs;
    return surahs.filter(
      (s) => String(s.number) === q || normalize(s.nameAr).includes(q) || normalize(s.nameEn).includes(q),
    );
  }, [query, surahs]);

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <BookOpenText className="size-5 text-brand" /> {t("chooseBook")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TAFSIR_BOOKS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBook(b)}
              aria-pressed={b === book}
              className={`relative rounded-2xl border bg-card p-4 text-start transition hover:border-brand/50 ${
                b === book ? "border-brand ring-2 ring-brand/30" : ""
              }`}
            >
              {b === book && <Check className="absolute end-3 top-3 size-4 text-brand" />}
              <p className="font-bold text-brand">{t(`books.${b}.title`)}</p>
              <p className="text-xs text-gold">{t(`books.${b}.author`)}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t(`books.${b}.about`)}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} className="h-11 ps-9" />
      </div>
      {filtered.length === 0 && <p className="py-8 text-center text-muted-foreground">{t("noResults", { query })}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <Link
            key={s.number}
            href={tafseerHref(s.number, book)}
            className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:border-brand/50 hover:shadow-sm"
          >
            <span className="grid size-10 shrink-0 rotate-45 place-items-center rounded-lg border-2 border-gold/60">
              <span className="-rotate-45 text-sm font-bold">{toLocaleDigits(s.number, locale)}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{locale === "ar" ? `سورة ${s.nameShortAr}` : s.nameEn}</p>
              <p className="text-xs text-muted-foreground">
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
