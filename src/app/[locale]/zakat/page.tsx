import { Coins } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { ZakatCalculator } from "@/components/zakat/zakat-calculator";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("zakat.title") };
}

export default async function ZakatPage({ params }: PageProps<"/[locale]/zakat">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tf, t] = await Promise.all([getTranslations("features"), getTranslations("zakat")]);
  return (
    <>
      <PageHeader title={tf("zakat.title")} subtitle={tf("zakat.desc")} />
      <div className="hero-gradient mb-6 flex items-start gap-4 rounded-2xl p-5 text-white">
        <Coins className="size-10 shrink-0 text-gold" />
        <div>
          <p className="leading-7">{t("intro")}</p>
          <p className="mt-2 text-sm text-gold">{t("rate")}</p>
        </div>
      </div>
      <ZakatCalculator />
    </>
  );
}
