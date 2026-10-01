import { BookText } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { toLocaleDigits } from "@/components/page-header";
import { TafseerBrowser } from "@/components/tafseer/tafseer-browser";
import { getSurahs } from "@/lib/data";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("tafseer.title") };
}

export default async function TafseerPage({ params }: PageProps<"/[locale]/tafseer">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, surahs] = await Promise.all([getTranslations("tafseer"), getSurahs()]);
  const meccan = surahs.filter((s) => s.type === "meccan").length;
  const stats = [
    { label: t("totalSurahs"), value: surahs.length },
    { label: t("meccan"), value: meccan },
    { label: t("medinan"), value: surahs.length - meccan },
  ];

  return (
    <>
      <header className="hero-gradient mb-6 rounded-2xl p-6 text-white sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-xl bg-white/10">
            <BookText className="size-6 text-gold" />
          </span>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t("heroTitle")}</h1>
            <p className="mt-1 text-white/75">{t("heroSubtitle")}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 p-3 text-center">
              <p className="text-2xl font-bold text-gold">{toLocaleDigits(s.value, locale)}</p>
              <p className="text-xs text-white/75">{s.label}</p>
            </div>
          ))}
        </div>
      </header>
      <TafseerBrowser surahs={surahs} />
    </>
  );
}
