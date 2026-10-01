import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { ZikrList } from "@/components/azkar/zikr-list";
import { ChapterActions, FavoriteButton } from "@/components/muslim-fortress/chapter-actions";
import { PageHeader, toLocaleDigits } from "@/components/page-header";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getHisnChapters } from "@/lib/data/muslim-fortress";

export const dynamicParams = false;

export async function generateStaticParams() {
  const chapters = await getHisnChapters();
  return routing.locales.flatMap((locale) => chapters.map((c) => ({ locale, n: String(c.n) })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/muslim-fortress/[n]">) {
  const { n } = await params;
  return { title: (await getHisnChapters())[Number(n) - 1]?.title };
}

export default async function HisnChapterPage({ params }: PageProps<"/[locale]/muslim-fortress/[n]">) {
  const { locale, n } = await params;
  setRequestLocale(locale);
  const [t, tf, chapters] = await Promise.all([
    getTranslations("muslim-fortress"),
    getTranslations("features"),
    getHisnChapters(),
  ]);
  const chapter = chapters[Number(n) - 1];
  if (!chapter) notFound();
  const next = chapters[chapter.n];

  return (
    <>
      <Link href="/muslim-fortress" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
        <ChevronRight className="size-4 ltr:rotate-180" /> {tf("muslim-fortress.title")}
      </Link>
      <PageHeader
        title={<span dir="rtl">{chapter.title}</span>}
        subtitle={t("chapterOf", { n: toLocaleDigits(chapter.n, locale), total: toLocaleDigits(chapters.length, locale) })}
      >
        <FavoriteButton n={chapter.n} />
      </PageHeader>
      <ZikrList items={chapter.items} />
      {chapter.footnotes.length > 0 && (
        <section className="mt-6 rounded-2xl border bg-card p-5" dir="rtl">
          <h2 className="mb-3 font-bold text-brand">{t("footnotes")}</h2>
          <ol className="list-decimal space-y-2 ps-5 text-sm leading-relaxed text-muted-foreground">
            {chapter.footnotes.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ol>
        </section>
      )}
      <ChapterActions n={chapter.n} next={next && { n: next.n, title: next.title }} />
    </>
  );
}
