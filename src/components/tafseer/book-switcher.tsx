"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { DEFAULT_BOOK, TAFSIR_BOOKS, type TafsirBook, readSavedBook, saveBook, tafseerHref } from "./books";

/**
 * Tafsir book tabs for a surah. Each book is its own static route so only the
 * selected book's text is sent; the choice is remembered in localStorage.
 * On the plain surah route (Muyassar), a different saved book redirects.
 */
export function BookSwitcher({ surah, book, isDefaultRoute }: { surah: number; book: TafsirBook; isDefaultRoute?: boolean }) {
  const t = useTranslations("tafseer");
  const router = useRouter();

  useEffect(() => {
    if (!isDefaultRoute) return saveBook(book);
    const saved = readSavedBook();
    if (saved !== DEFAULT_BOOK) router.replace(tafseerHref(surah, saved));
  }, [book, isDefaultRoute, router, surah]);

  return (
    <nav aria-label={t("book")} className="sticky top-14 z-30 -mx-4 mb-6 border-b bg-background/90 px-4 py-3 backdrop-blur">
      <div className="flex gap-2 overflow-x-auto">
        {TAFSIR_BOOKS.map((b) => (
          <Link
            key={b}
            href={tafseerHref(surah, b)}
            onClick={() => saveBook(b)}
            aria-current={b === book ? "page" : undefined}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
              b === book ? "border-brand bg-primary font-bold text-primary-foreground" : "bg-card hover:border-brand/50"
            }`}
          >
            {t(`books.${b}.title`)}
          </Link>
        ))}
      </div>
    </nav>
  );
}
