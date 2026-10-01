"use client";

import { BookmarkX, BookOpenText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import { BOOKMARKS_KEY, LAST_PAGE_KEY, type Bookmark } from "@/components/quran/mushaf-reader";
import { SurahList } from "@/components/quran/surah-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Surah } from "@/lib/data";

type Start = { n: number; surah: number; ayah: number; page: number };

const card = "rounded-2xl border bg-card p-4 transition hover:border-brand/50";

/** Mushaf index: continue-reading card, then Surahs / Juz / Hizb / Bookmarks tabs. */
export function QuranIndex({
  surahs,
  juz,
  quarters,
  pageSurah,
}: {
  surahs: Surah[];
  juz: Start[];
  quarters: Start[];
  /** First surah of each page (index = page - 1). */
  pageSurah: number[];
}) {
  const t = useTranslations("quran");
  const locale = useLocale();
  const [lastPage, , loaded] = useLocalStorage<number>(LAST_PAGE_KEY, 0);
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>(BOOKMARKS_KEY, []);
  const d = (n: number) => toLocaleDigits(n, locale);
  const name = (n: number) => (locale === "ar" ? `سورة ${surahs[n - 1].nameShortAr}` : surahs[n - 1].nameEn);
  const at = (s: number, a: number) => `${name(s)} ${d(a)}`;
  const hizbs = Array.from({ length: 60 }, (_, i) => quarters.slice(i * 4, i * 4 + 4));
  const fractions = ["", "¼", "½", "¾"];

  return (
    <>
      <Link
        href={`/quran/page/${lastPage || 1}`}
        className="hero-gradient mb-6 flex items-center gap-4 rounded-2xl p-5 text-white transition hover:opacity-95"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/15">
          <BookOpenText className="size-6 text-gold" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold">{loaded && lastPage ? t("continueReading") : t("startReading")}</span>
          <span className="block text-sm text-white/80">
            {loaded && lastPage
              ? `${t("page", { n: d(lastPage) })} · ${name(pageSurah[lastPage - 1])}`
              : `${t("page", { n: d(1) })} · ${name(1)}`}
          </span>
        </span>
      </Link>

      <Tabs defaultValue="surahs">
        <TabsList className="mb-4 w-full sm:w-fit">
          <TabsTrigger value="surahs">{t("tabSurahs")}</TabsTrigger>
          <TabsTrigger value="juz">{t("tabJuz")}</TabsTrigger>
          <TabsTrigger value="hizb">{t("tabHizb")}</TabsTrigger>
          <TabsTrigger value="bookmarks">{t("tabBookmarks")}</TabsTrigger>
        </TabsList>

        <TabsContent value="surahs">
          <SurahList surahs={surahs} />
        </TabsContent>

        <TabsContent value="juz">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {juz.map((j) => (
              <Link key={j.n} href={`/quran/page/${j.page}`} className={`${card} flex items-center gap-4`}>
                <span className="grid size-10 shrink-0 rotate-45 place-items-center rounded-lg border-2 border-gold/60">
                  <span className="-rotate-45 text-sm font-bold">{d(j.n)}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{t("juz", { n: d(j.n) })}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {at(j.surah, j.ayah)} · {t("page", { n: d(j.page) })}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hizb">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hizbs.map((qs, i) => (
              <div key={i} className="rounded-2xl border bg-card p-4">
                <Link href={`/quran/page/${qs[0].page}`} className="mb-2 flex items-baseline justify-between gap-2 hover:text-brand">
                  <span className="font-bold">{t("hizb", { n: d(i + 1) })}</span>
                  <span className="truncate text-xs text-muted-foreground">{at(qs[0].surah, qs[0].ayah)}</span>
                </Link>
                <div className="grid grid-cols-4 gap-1.5">
                  {qs.map((q, k) => (
                    <Link
                      key={q.n}
                      href={`/quran/page/${q.page}`}
                      title={at(q.surah, q.ayah)}
                      className="rounded-lg bg-secondary px-1 py-1.5 text-center text-xs hover:bg-brand/15 hover:text-brand"
                    >
                      <span className="block font-bold">{k ? fractions[k] : "۞"}</span>
                      <span className="block text-muted-foreground">{d(q.page)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bookmarks">
          {loaded && bookmarks.length === 0 && <p className="py-8 text-center text-muted-foreground">{t("noBookmarks")}</p>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((b) => (
              <div key={`${b.surah}:${b.ayah}`} className={`${card} flex items-center gap-2`}>
                <Link href={`/quran/page/${b.page}?ayah=${b.surah}:${b.ayah}`} className="min-w-0 flex-1">
                  <span className="block font-bold">{name(b.surah)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t("ayah", { n: d(b.ayah) })} · {t("page", { n: d(b.page) })}
                  </span>
                </Link>
                <button
                  type="button"
                  aria-label={t("unbookmark")}
                  title={t("unbookmark")}
                  onClick={() => setBookmarks((l) => l.filter((x) => !(x.surah === b.surah && x.ayah === b.ayah)))}
                  className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <BookmarkX className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
