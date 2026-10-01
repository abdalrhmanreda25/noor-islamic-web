import { getTranslations, setRequestLocale } from "next-intl/server";
import { mushafFontCss } from "@/components/quran/mushaf-page";
import { MushafReader } from "@/components/quran/mushaf-reader";
import { routing } from "@/i18n/routing";
import { getSurahAyahs, getSurahs } from "@/lib/data";
import { getMushafIndex, getMushafPage, MUSHAF_PAGES } from "@/lib/data/quran-pages";

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    Array.from({ length: MUSHAF_PAGES }, (_, i) => ({ locale, page: String(i + 1) })),
  );
}

export async function generateMetadata({ params }: PageProps<"/[locale]/quran/page/[page]">) {
  const { locale, page } = await params;
  const t = await getTranslations({ locale, namespace: "quran" });
  const f = await getTranslations({ locale, namespace: "features" });
  return { title: `${t("page", { n: page })} | ${f("quran.title")}` };
}

export default async function MushafPageRoute({ params }: PageProps<"/[locale]/quran/page/[page]">) {
  const { locale, page: param } = await params;
  setRequestLocale(locale);
  const page = Number(param);
  // Two-page spread: the odd page sits on the right.
  const right = page % 2 ? page : page - 1;
  const spreadPages = [right, right + 1].filter((p) => p <= MUSHAF_PAGES);

  const [index, surahs, spread] = await Promise.all([
    getMushafIndex(),
    getSurahs(),
    Promise.all(spreadPages.map(getMushafPage)),
  ]);

  // Text + tafsir of every ayah on the spread, for the ayah action sheet.
  const keys = new Set(
    spread.flatMap((d) => d.rows.flatMap((r) => (r.t === "l" ? r.s.map(([s, a]) => `${s}:${a}`) : []))),
  );
  const ayahs: Record<string, { text: string; tafseer: string }> = {};
  for (const s of new Set(spread.flatMap((d) => d.surahs))) {
    for (const a of await getSurahAyahs(s)) {
      const k = `${s}:${a.n}`;
      if (keys.has(k)) ayahs[k] = { text: a.text, tafseer: a.tafseer };
    }
  }

  const neighbours = [right - 2, right - 1, right + 2, right + 3].filter((p) => p >= 1 && p <= MUSHAF_PAGES);
  const fontUrl = (p: number) => `/fonts/qcf/p${String(p).padStart(3, "0")}.${index.fontExt}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: mushafFontCss(spreadPages, index.fontExt) }} />
      {neighbours.map((p) => (
        <link key={p} rel="prefetch" href={fontUrl(p)} as="font" crossOrigin="anonymous" />
      ))}
      <MushafReader
        page={page}
        spread={spread}
        lineWidth={index.lineWidth}
        surahs={surahs.map((s, i) => ({ n: s.number, ar: s.nameShortAr, en: s.nameEn, page: index.surahs[i].page }))}
        juzPages={index.juz.map((j) => j.page)}
        ayahs={ayahs}
      />
    </>
  );
}
