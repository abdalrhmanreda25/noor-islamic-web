import { setRequestLocale } from "next-intl/server";
import { BookView, getBookMeta } from "@/components/hadith/book-view";
import { routing } from "@/i18n/routing";
import { getAllHadithBooks, HADITH_PAGE_SIZE } from "@/lib/data/hadith";

export const dynamicParams = false;

// Page 1 is the book URL itself; only pages 2..n live here.
export async function generateStaticParams() {
  const books = await getAllHadithBooks();
  return routing.locales.flatMap((locale) =>
    books.flatMap(({ collection, book }) =>
      Array.from({ length: Math.ceil(book.count / HADITH_PAGE_SIZE) - 1 }, (_, i) => ({
        locale,
        collection,
        book: book.id,
        page: String(i + 2),
      })),
    ),
  );
}

export async function generateMetadata({ params }: PageProps<"/[locale]/hadith/[collection]/[book]/[page]">) {
  const { locale, collection, book, page } = await params;
  const m = await getBookMeta(collection, book);
  if (!m) return {};
  const name = locale === "ar" ? `${m.b.nameAr} - ${m.c.nameAr}` : `${m.b.nameEn || m.b.nameAr} - ${m.c.nameEn}`;
  return { title: `${name} (${page})` };
}

export default async function HadithBookPageN({ params }: PageProps<"/[locale]/hadith/[collection]/[book]/[page]">) {
  const { locale, collection, book, page } = await params;
  setRequestLocale(locale);
  return <BookView locale={locale} collection={collection} book={book} page={Number(page)} />;
}
