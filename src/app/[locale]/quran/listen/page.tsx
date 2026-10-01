import { AudioLines } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ListenSurahPicker } from "@/components/quran-listen/listen-surah-picker";
import { getSurahs } from "@/lib/data";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("quran-listen.title") };
}

export default async function QuranListenPage({ params }: PageProps<"/[locale]/quran/listen">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tf, surahs] = await Promise.all([getTranslations("quran-listen"), getTranslations("features"), getSurahs()]);
  return (
    <>
      <header className="hero-gradient mb-6 flex items-start gap-4 rounded-2xl p-5 text-white shadow-xl shadow-primary/20 sm:p-7">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-gold">
          <AudioLines className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{tf("quran-listen.title")}</h1>
          <p className="mt-1 font-bold text-gold">{t("heroTitle")}</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">{t("heroDesc")}</p>
        </div>
      </header>
      <ListenSurahPicker surahs={surahs} />
    </>
  );
}
