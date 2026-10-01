import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import {
  getHadithBook,
  getHadithBooks,
  getHadithCollection,
  HADITH_PAGE_SIZE,
} from "@/lib/data/hadith";
import { BookSearch } from "./book-search";
import { HadithCard, hadithNo } from "./hadith-card";
import { Pagination } from "./pagination";

export async function getBookMeta(collection: string, book: string) {
  const [c, books] = await Promise.all([getHadithCollection(collection), getHadithBooks(collection).catch(() => [])]);
  const b = books.find((x) => x.id === book);
  return c && b ? { c, b, pages: Math.max(1, Math.ceil(b.count / HADITH_PAGE_SIZE)) } : null;
}

/** One page (HADITH_PAGE_SIZE hadiths) of a book, with whole-book search. */
export async function BookView({
  locale,
  collection,
  book,
  page,
}: {
  locale: string;
  collection: string;
  book: string;
  page: number;
}) {
  const meta = await getBookMeta(collection, book);
  if (!meta || page < 1 || page > meta.pages) notFound();
  const { c, b, pages } = meta;
  const [t, all] = await Promise.all([getTranslations("hadith"), getHadithBook(collection, book)]);
  const ar = locale === "ar";
  const start = (page - 1) * HADITH_PAGE_SIZE;
  const hadiths = all.slice(start, start + HADITH_PAGE_SIZE);
  const collectionName = ar ? c.nameAr : c.nameEn;
  const gradedBy = ar ? c.gradedByAr : c.gradedByEn;
  const chapterOf = (i: number) => {
    const h = all[i];
    const title = ar ? h.chapterAr : h.chapterEn || h.chapterAr;
    return title === "باب" ? "" : title; // untitled chapters carry just "باب"
  };

  return (
    <>
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/hadith" className="text-brand hover:underline">{t("allCollections")}</Link>
        <span>/</span>
        <Link href={`/hadith/${c.id}`} className="text-brand hover:underline">{collectionName}</Link>
      </nav>
      <section className="hero-gradient mb-6 rounded-2xl p-5 text-white shadow-xl shadow-primary/20 sm:p-7">
        <p className="text-sm text-gold">{collectionName}</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl" dir="auto">{ar ? b.nameAr : b.nameEn || b.nameAr}</h1>
        {!ar && b.nameAr && <p className="mt-1 text-white/70"><span dir="rtl" lang="ar">{b.nameAr}</span></p>}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/10 px-3 py-1">{t("hadiths", { count: toLocaleDigits(b.count, locale) })}</span>
          {b.first && b.last && (
            <span className="rounded-full bg-white/10 px-3 py-1">
              {t("range", { from: hadithNo(b.first, locale), to: hadithNo(b.last, locale) })}
            </span>
          )}
          {pages > 1 && (
            <span className="rounded-full bg-gold/20 px-3 py-1 text-gold">
              {t("page", { n: toLocaleDigits(page, locale), total: toLocaleDigits(pages, locale) })}
            </span>
          )}
        </div>
      </section>

      <BookSearch url={`/ar/hadith/${c.id}/${b.id}/hadiths.json`} gradedBy={gradedBy} source={collectionName}>
        {hadiths.length === 0 && <p className="py-10 text-center text-muted-foreground">{t("empty")}</p>}
        <div className="space-y-4">
          {hadiths.map((h, i) => {
            const chapter = chapterOf(start + i);
            const showChapter = chapter && (i === 0 || chapter !== chapterOf(start + i - 1));
            return (
              <div key={`${h.number}-${start + i}`}>
                {showChapter && (
                  <h2 dir="auto" className="mb-3 mt-8 border-s-4 border-gold ps-3 text-lg font-bold text-brand">{chapter}</h2>
                )}
                <HadithCard hadith={h} gradedBy={gradedBy} source={collectionName} />
              </div>
            );
          })}
        </div>
        <Pagination base={`/hadith/${c.id}/${b.id}`} page={page} total={pages} />
      </BookSearch>
    </>
  );
}
