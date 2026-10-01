import { Target } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { KhatmaManager } from "@/components/khatma/khatma-manager";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("khatma.title") };
}

export default async function KhatmaPage({ params }: PageProps<"/[locale]/khatma">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("khatma");
  return (
    <>
      <header className="hero-gradient mb-6 flex items-center gap-3 rounded-2xl p-6 text-white sm:p-8">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10">
          <Target className="size-6 text-gold" />
        </span>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{t("heroTitle")}</h1>
          <p className="mt-1 text-white/75">{t("heroSubtitle")}</p>
        </div>
      </header>
      <KhatmaManager />
    </>
  );
}
