import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import { CopyButton } from "@/components/asbab-nuzul/copy-button";
import { routing } from "@/i18n/routing";
import { getSurahAyahs, getSurahs } from "@/lib/data";
import { WAHIDI_MISSING_SURAHS, getWahidi } from "@/lib/data/asbab-nuzul";

export const dynamicParams = false;

export async function generateStaticParams() {
  const surahs = new Set([...(await getWahidi()).entries.map((e) => e[0]), ...WAHIDI_MISSING_SURAHS]);
  return routing.locales.flatMap((locale) => [...surahs].map((s) => ({ locale, surah: String(s) })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/asbab-nuzul/surah/[surah]">) {
  const { locale, surah } = await params;
  const s = (await getSurahs())[Number(surah) - 1];
  const t = await getTranslations({ locale, namespace: "features" });
  return { title: `${t("asbab-nuzul.title")} · ${locale === "ar" ? `سورة ${s.nameShortAr}` : s.nameEn}` };
}

export default async function AsbabSurahPage({ params }: PageProps<"/[locale]/asbab-nuzul/surah/[surah]">) {
  const { locale, surah: param } = await params;
  setRequestLocale(locale);
  const n = Number(param);
  if (!(n >= 1 && n <= 114)) notFound();
  const [t, surahs, ayahs, wahidi] = await Promise.all([
    getTranslations("asbab-nuzul"),
    getSurahs(),
    getSurahAyahs(n),
    getWahidi(),
  ]);
  const surah = surahs[n - 1];
  const entries = wahidi.entries.filter((e) => e[0] === n);
  const d = (x: number) => toLocaleDigits(x, locale);
  const label = (from: number, to: number) =>
    from === to ? t("ayah", { n: d(from) }) : t("ayahRange", { from: d(from), to: d(to) });
  const sourceName = `${wahidi.source.title} للواحدي`;

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/asbab-nuzul" className="mb-4 inline-block text-sm text-brand hover:underline">{t("back")}</Link>
      <header className="hero-gradient mb-6 rounded-2xl p-6 text-center text-white">
        <p className="quran-text text-4xl text-gold" dir="rtl">سورة {surah.nameShortAr}</p>
        {locale === "en" && <p className="mt-1 text-white/80">{surah.nameEn}</p>}
        <p className="mt-2 text-sm text-white/70">
          {t("entries", { count: entries.length, n: d(entries.length) })}
        </p>
      </header>

      {entries.length === 0 && (
        <p className="rounded-2xl border bg-card p-5 leading-loose text-muted-foreground">{t("missing")}</p>
      )}

      <div className="space-y-5">
        {entries.map(([, from, to, text]) => {
          const verses = ayahs.slice(from - 1, to);
          return (
            <section key={`${from}-${to}`} id={`ayah-${from}`} className="scroll-mt-20 rounded-2xl border bg-card p-5 target:border-gold">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Link href={`/quran/${n}#ayah-${from}`} className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-brand hover:underline">
                  {label(from, to)}
                </Link>
                <CopyButton text={`${t("reason")} — سورة ${surah.nameShortAr}، ${from === to ? from : `${from}-${to}`}\n\n${text}\n\n${t("source", { name: sourceName })}`} />
              </div>
              <p className="quran-text max-h-60 overflow-y-auto rounded-xl bg-muted/60 p-3 text-xl" dir="rtl">
                {verses.map((v) => (
                  <span key={v.n}>
                    {v.text} <span className="ayah-marker">﴿{toLocaleDigits(v.n, "ar")}﴾</span>{" "}
                  </span>
                ))}
              </p>
              <h3 className="mb-1 mt-4 text-sm font-bold text-gold">{t("reason")}</h3>
              <p className="whitespace-pre-line leading-loose" dir="rtl">{text}</p>
              <p className="mt-3 text-xs text-muted-foreground">{t("source", { name: sourceName })}</p>
            </section>
          );
        })}
      </div>
    </article>
  );
}
