import { GitCompare, Lightbulb, Sparkles } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { toLocaleDigits } from "@/components/page-header";
import { BracketText } from "@/components/mutashabihat/diff-text";
import { DiffToggle } from "@/components/mutashabihat/diff-toggle";
import { MutashabihatTabs } from "@/components/mutashabihat/mutashabihat-tabs";
import { MutashabihSurahPicker } from "@/components/mutashabihat/surah-picker";
import { getSurahs } from "@/lib/data";
import { getMutashabihatGroups, getMutashabihatIndex, getMutashabihatSurahCounts } from "@/lib/data/mutashabihat";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("mutashabihat.title") };
}

export default async function MutashabihatPage({ params }: PageProps<"/[locale]/mutashabihat">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tf, { groups }, index, counts, surahs] = await Promise.all([
    getTranslations("mutashabihat"),
    getTranslations("features"),
    getMutashabihatGroups(),
    getMutashabihatIndex(),
    getMutashabihatSurahCounts(),
    getSurahs(),
  ]);
  const rows = counts.map((c) => ({ ...c, nameAr: surahs[c.surah - 1].nameShortAr, nameEn: surahs[c.surah - 1].nameEn }));

  const groupsPanel = (
    <DiffToggle>
      <div className="space-y-5">
        {groups.map((g) => (
          <article key={g.id} className="rounded-2xl border bg-card p-5" dir="rtl">
            <h2 className="mb-4 text-lg font-bold text-brand">{g.title}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {g.verses.map((v) => (
                <div key={v.location} className="rounded-xl bg-muted/60 p-4">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-gold">{v.location}</span>
                  <p className="quran-text mt-2 text-xl leading-[2.2]">
                    <BracketText text={v.text} />
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-sm leading-relaxed">
              <p className="flex gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
                <span><b className="text-brand">{t("difference")}: </b>{g.note}</span>
              </p>
              <p className="flex gap-2 rounded-xl bg-gold/10 p-3">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-gold" />
                <span><b className="text-gold">{t("tip")}: </b>{g.tip}</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </DiffToggle>
  );

  const allPanel = (
    <>
      <div className="mb-5 rounded-2xl border bg-card p-5">
        <p className="leading-relaxed">
          {t("allIntro", {
            ayat: t("ayatCount", { count: index.stats.ayat, n: toLocaleDigits(index.stats.ayat, locale) }),
            surahs: t("surahsCount", { count: index.stats.surahs, n: toLocaleDigits(index.stats.surahs, locale) }),
          })}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("source", { name: index.source.name, author: index.source.author })}{" "}
          <a href={index.source.url} target="_blank" rel="noreferrer" className="text-brand hover:underline" dir="ltr">
            GitHub
          </a>
        </p>
      </div>
      <MutashabihSurahPicker rows={rows} />
    </>
  );

  return (
    <>
      <header className="hero-gradient mb-6 flex items-center gap-3 rounded-2xl p-6 text-white sm:p-8">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10">
          <GitCompare className="size-6 text-gold" />
        </span>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{tf("mutashabihat.title")}</h1>
          <p className="mt-1 text-white/75">{t("heroSubtitle")}</p>
        </div>
      </header>
      <MutashabihatTabs labels={[t("groupsTab"), t("allTab")]} groups={groupsPanel} all={allPanel} />
    </>
  );
}
