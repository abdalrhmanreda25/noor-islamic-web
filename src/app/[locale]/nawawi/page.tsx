import { getTranslations, setRequestLocale } from "next-intl/server";
import { NawawiBrowser } from "@/components/nawawi/nawawi-browser";
import { getNawawi } from "@/lib/data";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("nawawi.title") };
}

export default async function NawawiPage({ params }: PageProps<"/[locale]/nawawi">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, list] = await Promise.all([getTranslations("features"), getNawawi()]);
  return <NawawiBrowser list={list} title={t("nawawi.title")} />;
}
