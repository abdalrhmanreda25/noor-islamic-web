import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { toLocaleDigits } from "@/components/page-header";
import { FiqhBlockView, FiqhSteps } from "@/components/fiqh/block-view";
import { FiqhIcon } from "@/components/fiqh/icons";
import { FiqhTopicActions } from "@/components/fiqh/topic-actions";
import { getFiqhCategoryTopics, getFiqhIndex, getFiqhOrder } from "@/lib/data/fiqh";

export const dynamicParams = false;

export async function generateStaticParams() {
  const order = await getFiqhOrder();
  return routing.locales.flatMap((locale) => order.map((t) => ({ locale, category: t.category, topic: t.id })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/fiqh/[category]/[topic]">) {
  const { topic } = await params;
  return { title: (await getFiqhOrder()).find((t) => t.id === topic)?.question };
}

export default async function FiqhTopicPage({ params }: PageProps<"/[locale]/fiqh/[category]/[topic]">) {
  const { locale, category: categoryId, topic: topicId } = await params;
  setRequestLocale(locale);
  const [t, { categories }, order] = await Promise.all([getTranslations("fiqh"), getFiqhIndex(), getFiqhOrder()]);
  const category = categories.find((c) => c.id === categoryId);
  const topic = category && (await getFiqhCategoryTopics(category.id)).find((x) => x.id === topicId);
  if (!category || !topic) notFound();

  const i = order.findIndex((x) => x.id === topic.id);
  const ref = (x: (typeof order)[number] | undefined) =>
    x ? { href: `/fiqh/${x.category}/${x.id}`, question: x.question } : null;
  const n = category.topics.findIndex((x) => x.id === topic.id) + 1;

  return (
    <article className="mx-auto max-w-3xl">
      <Link
        href={`/fiqh/${category.id}`}
        className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand hover:bg-brand/15"
      >
        <FiqhIcon id={category.id} className="size-3.5" />
        <bdi>{category.title}</bdi>
        <span aria-hidden>·</span>
        <span>{t("ofCount", { n: toLocaleDigits(n, locale), total: toLocaleDigits(category.topics.length, locale) })}</span>
      </Link>
      <div dir="rtl" className="mt-3 space-y-4">
        <h1 className="text-2xl leading-snug font-black text-brand sm:text-3xl">{topic.question}</h1>
        {topic.intro && (
          <p className="rounded-2xl bg-brand/8 p-4 leading-loose font-medium">{topic.intro}</p>
        )}
        {topic.steps ? (
          <FiqhSteps blocks={topic.blocks} locale={locale} />
        ) : (
          topic.blocks.map((b, j) => <FiqhBlockView key={j} block={b} />)
        )}
      </div>
      <FiqhTopicActions id={topic.id} prev={ref(order[i - 1])} next={ref(order[i + 1])} />
    </article>
  );
}
