import { BookOpen, Library } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import { getHadithCollections } from "@/lib/data/hadith";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("hadith.title") };
}

export default async function HadithPage({ params }: PageProps<"/[locale]/hadith">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tf, t, collections] = await Promise.all([
    getTranslations("features"),
    getTranslations("hadith"),
    getHadithCollections(),
  ]);
  const ar = locale === "ar";
  const fmt = (n: number) => n.toLocaleString(ar ? "ar-EG" : "en-US");
  const total = collections.reduce((n, c) => n + c.hadiths, 0);
  const books = collections.reduce((n, c) => n + c.books, 0);

  return (
    <>
      <section className="hero-gradient mb-6 overflow-hidden rounded-2xl p-5 text-white shadow-xl shadow-primary/20 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-gold">
            <Library className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{tf("hadith.title")}</h1>
            <p className="mt-1 text-white/75">{t("subtitle")}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            [t("collections", { count: "" }), toLocaleDigits(collections.length, locale)],
            [t("books", { count: "" }), fmt(books)],
            [t("hadiths", { count: "" }), fmt(total)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xl font-bold text-gold tabular-nums sm:text-2xl">{value}</p>
              <p className="text-xs text-white/70">{label.trim()}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c, i) => (
          <Link
            key={c.id}
            href={`/hadith/${c.id}`}
            className="group flex flex-col rounded-2xl border bg-card p-5 transition hover:border-brand/50 hover:shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-brand">
                <BookOpen className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-bold group-hover:text-brand">{ar ? c.nameAr : c.nameEn}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{ar ? c.authorAr : c.authorEn}</p>
              </div>
              <span className="ms-auto text-xs text-muted-foreground">{toLocaleDigits(i + 1, locale)}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-secondary px-2.5 py-0.5">{t("books", { count: toLocaleDigits(c.books, locale) })}</span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5">{t("hadiths", { count: fmt(c.hadiths) })}</span>
              {(ar ? c.gradedByAr : c.gradedByEn) && (
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-brand">
                  {t("gradedBy", { name: (ar ? c.gradedByAr : c.gradedByEn)! })}
                </span>
              )}
            </div>
            {(ar ? c.noteAr : c.noteEn) && <p className="mt-3 text-xs text-gold">{ar ? c.noteAr : c.noteEn}</p>}
          </Link>
        ))}
      </div>
    </>
  );
}
