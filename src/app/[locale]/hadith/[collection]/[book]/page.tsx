import { setRequestLocale } from "next-intl/server";
import { BookView, getBookMeta } from "@/components/hadith/book-view";
import { routing } from "@/i18n/routing";
import { getAllHadithBooks } from "@/lib/data/hadith";

export const dynamicParams = false;

export async function generateStaticParams() {
  const books = await getAllHadithBooks();
  return routing.locales.flatMap((locale) => books.map(({ collection, book }) => ({ locale, collection, book: book.id })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/hadith/[collection]/[book]">) {
  const { locale, collection, book } = await params;
  const m = await getBookMeta(collection, book);
  if (!m) return {};
  return { title: locale === "ar" ? `${m.b.nameAr} - ${m.c.nameAr}` : `${m.b.nameEn || m.b.nameAr} - ${m.c.nameEn}` };
}

export default async function HadithBookPage({ params }: PageProps<"/[locale]/hadith/[collection]/[book]">) {
  const { locale, collection, book } = await params;
  setRequestLocale(locale);
  return <BookView locale={locale} collection={collection} book={book} page={1} />;
}
