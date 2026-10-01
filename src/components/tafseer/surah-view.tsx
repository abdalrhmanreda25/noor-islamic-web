import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import { getSurahAyahs, getSurahs } from "@/lib/data";
import { getTafsir } from "@/lib/data/tafseer";
import { AyahActions, GoToAyah } from "./ayah-tools";
import { BookSwitcher } from "./book-switcher";
import { type TafsirBook, tafseerHref } from "./books";

/** One surah with every ayah followed by the selected book's tafsir. */
export async function TafseerSurahView({
  locale,
  surah: number,
  book,
  isDefaultRoute,
}: {
  locale: string;
  surah: number;
  book: TafsirBook;
  isDefaultRoute?: boolean;
}) {
  const [t, surahs, ayahs, tafsir] = await Promise.all([
    getTranslations("tafseer"),
    getSurahs(),
    getSurahAyahs(number),
    getTafsir(book, number),
  ]);
  const surah = surahs[number - 1];
  const prev = surahs[number - 2];
  const next = surahs[number];
  const name = (s: typeof surah) => (locale === "ar" ? `سورة ${s.nameShortAr}` : s.nameEn);
  const Prev = locale === "ar" ? ChevronRight : ChevronLeft;
  const Next = locale === "ar" ? ChevronLeft : ChevronRight;
  const bookTitle = t(`books.${book}.title`);

  return (
    <article>
      <header className="hero-gradient mb-4 rounded-2xl p-6 text-center text-white">
        <p className="quran-text text-4xl text-gold" dir="rtl">سورة {surah.nameShortAr}</p>
        {locale === "en" && <p className="mt-1 text-white/80">{surah.nameEn} · {surah.translationEn}</p>}
        <p className="mt-2 text-sm text-white/70">
          {bookTitle} · {t(surah.type)} · {t("ayahs", { count: toLocaleDigits(surah.ayahs, locale) })}
        </p>
      </header>

      <BookSwitcher surah={number} book={book} isDefaultRoute={isDefaultRoute} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/tafseer" className="text-sm text-brand hover:underline">{t("allSurahs")}</Link>
        <GoToAyah max={surah.ayahs} />
      </div>

      <div className="space-y-4">
        {ayahs.map((a, i) => {
          const text = tafsir[i] ?? "";
          return (
            <section key={a.n} id={`ayah-${a.n}`} className="scroll-mt-32 rounded-2xl border bg-card p-5 target:border-gold target:ring-2 target:ring-gold/30">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-brand">
                  {t("ayah", { n: toLocaleDigits(a.n, locale) })}
                </span>
                <AyahActions text={`${a.text} ﴿${a.n}﴾\n\n${bookTitle}:\n${text}\n\n${name(surah)}`} />
              </div>
              <p className="quran-text text-2xl sm:text-[1.75rem]" dir="rtl">
                {a.text} <span className="ayah-marker whitespace-nowrap">﴿{toLocaleDigits(a.n, "ar")}﴾</span>
              </p>
              <div className="mt-3 rounded-xl bg-muted p-4" dir="rtl">
                <p className="mb-1 text-xs font-bold text-gold">{t("tafsir")}</p>
                {text ? (
                  <p className="whitespace-pre-line text-base leading-loose">{text}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("merged")}</p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <nav className="mt-10 flex justify-between gap-4">
        {prev ? (
          <Link href={tafseerHref(prev.number, book)} className="flex items-center gap-1 rounded-lg border bg-card px-4 py-2 text-sm hover:border-brand/50">
            <Prev className="size-4" /> {name(prev)}
          </Link>
        ) : <span />}
        {next && (
          <Link href={tafseerHref(next.number, book)} className="flex items-center gap-1 rounded-lg border bg-card px-4 py-2 text-sm hover:border-brand/50">
            {name(next)} <Next className="size-4" />
          </Link>
        )}
      </nav>
    </article>
  );
}
