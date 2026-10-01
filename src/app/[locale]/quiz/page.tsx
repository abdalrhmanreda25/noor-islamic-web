import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { QuizApp } from "@/components/quiz/quiz-app";
import { getQuizBank } from "@/lib/data/quiz";

export async function generateMetadata() {
  return { title: (await getTranslations("features"))("quiz.title") };
}

export default async function QuizPage({ params }: PageProps<"/[locale]/quiz">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tf, bank] = await Promise.all([getTranslations("features"), getQuizBank()]);
  return (
    <>
      <PageHeader title={tf("quiz.title")} subtitle={tf("quiz.desc")} />
      <QuizApp bank={bank} />
    </>
  );
}
