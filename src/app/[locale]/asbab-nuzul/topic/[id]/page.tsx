import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getAsbabTopic, getAsbabTopics } from "@/lib/data/asbab-nuzul";

export const dynamicParams = false;

export async function generateStaticParams() {
  const { categories } = await getAsbabTopics();
  return routing.locales.flatMap((locale) => categories.flatMap((c) => c.topics.map((t) => ({ locale, id: t.id }))));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/asbab-nuzul/topic/[id]">) {
  const found = await getAsbabTopic((await params).id);
  return { title: found?.topic.question };
}

export default async function AsbabTopicPage({ params }: PageProps<"/[locale]/asbab-nuzul/topic/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const [t, found] = await Promise.all([getTranslations("asbab-nuzul"), getAsbabTopic(id)]);
  if (!found) notFound();
  const { category, topic } = found;

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/asbab-nuzul" className="mb-4 inline-block text-sm text-brand hover:underline">{t("back")}</Link>
      <header className="hero-gradient mb-6 rounded-2xl p-6 text-white sm:p-8" dir="rtl">
        <p className="text-sm text-gold">{category.icon} {category.title}</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{topic.question}</h1>
        <p className="mt-3 leading-loose text-white/80">{topic.intro}</p>
      </header>
      <div className="space-y-4" dir="rtl">
        {topic.blocks.map((b, i) => {
          switch (b.type) {
            case "heading":
              return <h2 key={i} className="pt-2 text-xl font-bold text-brand">{b.text}</h2>;
            case "text":
              return <p key={i} className="leading-loose">{b.text}</p>;
            case "verse":
              return (
                <figure key={i} className="rounded-2xl border border-gold/40 bg-card p-5 text-center">
                  <p className="quran-text text-2xl">﴿{b.text}﴾</p>
                  <figcaption className="mt-2 text-sm text-gold">{b.reference}</figcaption>
                </figure>
              );
            case "hadith":
              return (
                <figure key={i} className="rounded-2xl border-s-4 border-brand bg-secondary p-5">
                  <p className="leading-loose">{b.text}</p>
                  <figcaption className="mt-2 text-sm text-muted-foreground">{b.reference}</figcaption>
                </figure>
              );
          }
        })}
      </div>
    </article>
  );
}
