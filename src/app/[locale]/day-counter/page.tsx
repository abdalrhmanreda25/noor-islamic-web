import { getTranslations, setRequestLocale } from "next-intl/server";
import { DayCounter } from "@/components/day-counter/day-counter";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("day-counter.title") };
}

export default async function DayCounterPage({ params }: PageProps<"/[locale]/day-counter">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tf = await getTranslations("features");
  return (
    <>
      <PageHeader title={tf("day-counter.title")} subtitle={tf("day-counter.desc")} />
      <DayCounter />
    </>
  );
}
