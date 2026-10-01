import { Image as ImageIcon } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CardMaker } from "@/components/card-maker/card-maker";
import { getNawawi, getSurahAyahs, getSurahs } from "@/lib/data";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("card-maker.title") };
}

export default async function CardMakerPage({ params }: PageProps<"/[locale]/card-maker">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tf, surahs, nawawi, baqarah] = await Promise.all([
    getTranslations("card-maker"),
    getTranslations("features"),
    getSurahs(),
    getNawawi(),
    getSurahAyahs(2),
  ]);

  return (
    <>
      <header className="hero-gradient mb-6 flex items-center gap-3 rounded-2xl p-6 text-white sm:p-8">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10">
          <ImageIcon className="size-6 text-gold" />
        </span>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{tf("card-maker.title")}</h1>
          <p className="mt-1 text-white/75">{t("heroSubtitle")}</p>
        </div>
      </header>
      <CardMaker
        surahs={surahs.map((s) => ({ number: s.number, name: s.nameShortAr, nameEn: s.nameEn, ayahs: s.ayahs }))}
        hadiths={nawawi.map((h) => ({ number: h.number, title: h.title, text: h.text, source: h.source }))}
        initialAyahs={baqarah.map((a) => a.text)}
      />
    </>
  );
}
