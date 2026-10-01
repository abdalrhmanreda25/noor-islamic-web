import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import { BookList } from "@/components/hadith/book-list";
import { routing } from "@/i18n/routing";
import { getHadithBooks, getHadithCollection, getHadithCollections } from "@/lib/data/hadith";

export const dynamicParams = false;

export async function generateStaticParams() {
  const collections = await getHadithCollections();
  return routing.locales.flatMap((locale) => collections.map((c) => ({ locale, collection: c.id })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/hadith/[collection]">) {
  const { locale, collection } = await params;
  const c = await getHadithCollection(collection);
  return { title: locale === "ar" ? c?.nameAr : c?.nameEn };
}

export default async function HadithCollectionPage({ params }: PageProps<"/[locale]/hadith/[collection]">) {
  const { locale, collection } = await params;
  setRequestLocale(locale);
  const c = await getHadithCollection(collection);
  if (!c) notFound();
  const [t, books] = await Promise.all([getTranslations("hadith"), getHadithBooks(collection)]);
  const ar = locale === "ar";
  const gradedBy = ar ? c.gradedByAr : c.gradedByEn;
  const note = ar ? c.noteAr : c.noteEn;

  return (
    <>
      <Link href="/hadith" className="mb-4 inline-block text-sm text-brand hover:underline">{t("allCollections")}</Link>
      <section className="hero-gradient mb-6 rounded-2xl p-5 text-white shadow-xl shadow-primary/20 sm:p-7">
        <h1 className="text-2xl font-bold text-gold sm:text-3xl">{ar ? c.nameAr : c.nameEn}</h1>
        {!ar && <p className="mt-1 text-white/70"><span dir="rtl" lang="ar">{c.nameAr}</span></p>}
        <p className="mt-2 text-sm text-white/80">{ar ? c.authorAr : c.authorEn}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/10 px-3 py-1">{t("books", { count: toLocaleDigits(c.books, locale) })}</span>
          <span className="rounded-full bg-white/10 px-3 py-1">
            {t("hadiths", { count: c.hadiths.toLocaleString(ar ? "ar-EG" : "en-US") })}
          </span>
          {gradedBy && <span className="rounded-full bg-white/10 px-3 py-1">{t("gradedBy", { name: gradedBy })}</span>}
          {note && <span className="rounded-full bg-gold/20 px-3 py-1 text-gold">{note}</span>}
        </div>
      </section>
      <BookList collection={c.id} books={books} />
    </>
  );
}
