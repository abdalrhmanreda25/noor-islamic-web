import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import { DiffWords } from "@/components/mutashabihat/diff-text";
import { DiffToggle } from "@/components/mutashabihat/diff-toggle";
import { diffWords, splitWords } from "@/components/mutashabihat/word-diff";
import { routing } from "@/i18n/routing";
import { getSurahs } from "@/lib/data";
import { type Span, getMutashabihatSurahCounts, getSurahMutashabihat } from "@/lib/data/mutashabihat";

export const dynamicParams = false;

export async function generateStaticParams() {
  const counts = await getMutashabihatSurahCounts();
  return routing.locales.flatMap((locale) => counts.map((c) => ({ locale, surah: String(c.surah) })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/mutashabihat/[surah]">) {
  const { locale, surah } = await params;
  const s = (await getSurahs())[Number(surah) - 1];
  const t = await getTranslations({ locale, namespace: "mutashabihat" });
  return { title: t("surahTitle", { name: locale === "ar" ? `سورة ${s.nameShortAr}` : s.nameEn }) };
}

export default async function MutashabihatSurahPage({ params }: PageProps<"/[locale]/mutashabihat/[surah]">) {
  const { locale, surah: param } = await params;
  setRequestLocale(locale);
  const n = Number(param);
  if (!(n >= 1 && n <= 114)) notFound();
  const [t, surahs, items] = await Promise.all([getTranslations("mutashabihat"), getSurahs(), getSurahMutashabihat(n)]);
  const surah = surahs[n - 1];
  const d = (x: number) => toLocaleDigits(x, locale);
  const surahName = (s: number) => (locale === "ar" ? `سورة ${surahs[s - 1].nameShortAr}` : surahs[s - 1].nameEn);
  const spanLabel = (s: Span) =>
    `${surahName(s.surah)} · ${s.first === s.last ? t("ayah", { n: d(s.first) }) : t("ayah", { n: t("span", { from: d(s.first), to: d(s.last) }) })}`;

  return (
    <article className="mx-auto max-w-4xl">
      <Link href="/mutashabihat" className="mb-4 inline-block text-sm text-brand hover:underline">{t("back")}</Link>
      <header className="hero-gradient mb-4 rounded-2xl p-6 text-center text-white">
        <p className="quran-text text-4xl text-gold" dir="rtl">سورة {surah.nameShortAr}</p>
        <p className="mt-2 text-sm text-white/70">{t("surahIntro", { ayat: t("ayatCount", { count: items.length, n: d(items.length) }) })}</p>
      </header>

      <DiffToggle>
        <div className="space-y-5">
          {items.map((item) => (
            <section key={item.ayah} id={`ayah-${item.ayah}`} className="scroll-mt-32 rounded-2xl border bg-card p-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <Link href={`/quran/${n}#ayah-${item.ayah}`} className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-brand hover:underline">
                  {t("ayah", { n: d(item.ayah) })}
                </Link>
                <span className="text-xs text-muted-foreground">{t("similar", { count: d(item.matches.length) })}</span>
              </div>
              <p className="quran-text text-2xl" dir="rtl">
                {item.text} <span className="ayah-marker">﴿{toLocaleDigits(item.ayah, "ar")}﴾</span>
              </p>

              <div className="mt-4 space-y-3">
                {item.matches.map((m, i) => {
                  const own = splitWords(m.own.text);
                  const target = splitWords(m.target.text);
                  const diff = diffWords(own, target);
                  const ownIsAyah = m.own.first === item.ayah && m.own.last === item.ayah;
                  return (
                    <div key={i} className="grid gap-3 rounded-xl border border-dashed p-3 md:grid-cols-2">
                      <div className="rounded-lg bg-muted/60 p-3">
                        <p className="mb-1 text-xs font-bold text-muted-foreground">
                          {ownIsAyah ? t("thisAyah") : spanLabel(m.own)}
                        </p>
                        <p className="quran-text text-xl leading-[2.2]" dir="rtl">
                          <DiffWords words={own} diff={diff.a} />
                        </p>
                      </div>
                      <div className="rounded-lg bg-secondary/60 p-3">
                        <Link href={`/mutashabihat/${m.target.surah}#ayah-${m.target.first}`} className="mb-1 block text-xs font-bold text-gold hover:underline">
                          {t("comparedWith")} {spanLabel(m.target)}
                        </Link>
                        <p className="quran-text text-xl leading-[2.2]" dir="rtl">
                          <DiffWords words={target} diff={diff.b} />
                        </p>
                      </div>
                      {(m.next || m.previous) && (
                        <p className="text-xs text-muted-foreground md:col-span-2">
                          {m.next ? t("withNext") : t("withPrevious")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </DiffToggle>
    </article>
  );
}
