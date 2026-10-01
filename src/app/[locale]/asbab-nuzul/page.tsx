import { Scroll } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import { AsbabTabs } from "@/components/asbab-nuzul/asbab-tabs";
import { AsbabSurahSearch } from "@/components/asbab-nuzul/surah-search";
import { getSurahs } from "@/lib/data";
import { getAsbabTopics, getWahidi, getWahidiSurahSummaries } from "@/lib/data/asbab-nuzul";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("asbab-nuzul.title") };
}

export default async function AsbabPage({ params }: PageProps<"/[locale]/asbab-nuzul">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tf, topics, wahidi, summaries, surahs] = await Promise.all([
    getTranslations("asbab-nuzul"),
    getTranslations("features"),
    getAsbabTopics(),
    getWahidi(),
    getWahidiSurahSummaries(),
    getSurahs(),
  ]);
  const rows = summaries.map((s) => ({
    ...s,
    nameAr: surahs[s.surah - 1].nameShortAr,
    nameEn: surahs[s.surah - 1].nameEn,
  }));
  const { source } = wahidi;

  const topicsPanel = (
    <div className="space-y-8">
      {topics.categories.map((c) => (
        <section key={c.id}>
          <div className="mb-3 flex items-center gap-3" dir="rtl">
            <span className="grid size-10 place-items-center rounded-xl bg-secondary text-xl">{c.icon}</span>
            <div>
              <h2 className="text-lg font-bold">{c.title}</h2>
              <p className="text-sm text-muted-foreground">{c.subtitle}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {c.topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/asbab-nuzul/topic/${topic.id}`}
                className="rounded-2xl border bg-card p-5 transition hover:border-brand/50 hover:shadow-sm"
                dir="rtl"
              >
                <p className="font-bold text-brand">{topic.question}</p>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{topic.intro}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );

  const surahPanel = (
    <>
      <div className="mb-5 rounded-2xl border bg-card p-5">
        <p className="font-bold" dir="rtl">
          {source.title} — {source.author} (ت {source.death} هـ)
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("entryStats", {
            entries: t("entries", { count: wahidi.entries.length, n: toLocaleDigits(wahidi.entries.length, locale) }),
            surahs: toLocaleDigits(rows.length, locale),
          })}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("sourceNote", { via: source.via })}
        </p>
      </div>
      <AsbabSurahSearch rows={rows} />
    </>
  );

  return (
    <>
      <header className="hero-gradient mb-6 flex items-center gap-3 rounded-2xl p-6 text-white sm:p-8">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10">
          <Scroll className="size-6 text-gold" />
        </span>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{tf("asbab-nuzul.title")}</h1>
          <p className="mt-1 text-white/75">{t("heroSubtitle")}</p>
        </div>
      </header>
      <AsbabTabs labels={[t("topicsTab"), t("surahTab")]} topics={topicsPanel} surahs={surahPanel} />
    </>
  );
}
