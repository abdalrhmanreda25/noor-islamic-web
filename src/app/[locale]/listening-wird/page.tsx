import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { WirdPlayer } from "@/components/listening-wird/wird-player";
import { getSurahs } from "@/lib/data";
import { getAyahReciters } from "@/lib/data/quran-listen";

// EveryAyah folder missing more than half its files (same exclusion as the app).
const INCOMPLETE = new Set(["Mustafa_Ismail_48kbps"]);

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("listening-wird.title") };
}

export default async function ListeningWirdPage({ params }: PageProps<"/[locale]/listening-wird">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tf, t, surahs, reciters] = await Promise.all([
    getTranslations("features"),
    getTranslations("listening-wird"),
    getSurahs(),
    getAyahReciters(),
  ]);
  return (
    <>
      <PageHeader title={tf("listening-wird.title")} subtitle={t("subtitle")} />
      <WirdPlayer
        surahs={surahs.map(({ number, nameShortAr, nameEn, ayahs }) => ({ number, nameShortAr, nameEn, ayahs }))}
        reciters={reciters.filter((r) => !INCOMPLETE.has(r.id))}
      />
    </>
  );
}
