import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getMushafIndex } from "@/lib/data/quran-pages";

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    Array.from({ length: 114 }, (_, i) => ({ locale, surah: String(i + 1) })),
  );
}

/**
 * Old surah URLs open the mushaf at the surah's first page. The browser keeps
 * `#ayah-N` across the redirect; with `?surah=` the reader turns it into the
 * ayah's page and highlights it.
 */
export default async function SurahRedirect({ params }: PageProps<"/[locale]/quran/[surah]">) {
  const { locale, surah } = await params;
  setRequestLocale(locale);
  const n = Number(surah);
  if (!(n >= 1 && n <= 114)) notFound();
  const { surahs } = await getMushafIndex();
  redirect({ href: { pathname: `/quran/page/${surahs[n - 1].page}`, query: { surah: n } }, locale });
}
