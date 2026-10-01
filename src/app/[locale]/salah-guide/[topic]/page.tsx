import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { toLocaleDigits } from "@/components/page-header";
import { CATEGORY_ICON } from "@/components/salah-guide/salah-guide-list";
import { TopicActions } from "@/components/salah-guide/topic-actions";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getSalahTopics, type SalahBlock } from "@/lib/data/salah-guide";
import { BookOpen } from "lucide-react";

export const dynamicParams = false;

export async function generateStaticParams() {
  const topics = await getSalahTopics();
  return routing.locales.flatMap((locale) => topics.map(({ topic }) => ({ locale, topic: topic.id })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/salah-guide/[topic]">) {
  const { topic } = await params;
  return { title: (await getSalahTopics()).find((x) => x.topic.id === topic)?.topic.question };
}

function Block({ block }: { block: SalahBlock }) {
  switch (block.type) {
    case "heading":
      return <h3 className="mt-6 text-lg font-bold text-brand">{block.text}</h3>;
    case "verse":
      return (
        <figure className="my-4 rounded-2xl border border-gold/40 bg-gold/5 p-5 text-center">
          <p className="quran-text text-xl sm:text-2xl">﴿{block.text}﴾</p>
          {block.reference && <figcaption className="mt-2 text-sm text-gold">{block.reference}</figcaption>}
        </figure>
      );
    case "hadith":
      return (
        <figure className="my-4 rounded-2xl border-s-4 border-brand bg-secondary/60 p-4">
          <p className="leading-loose">{block.text}</p>
          {block.reference && <figcaption className="mt-2 text-sm text-muted-foreground">{block.reference}</figcaption>}
        </figure>
      );
    case "list":
      return (
        <ul className="my-3 space-y-2">
          {block.text.split("\n").map((line) => (
            <li key={line} className="flex gap-2 leading-relaxed">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gold" />
              {line.replace(/^[٠-٩\d]+\)\s*/, "")}
            </li>
          ))}
          {block.reference && <li className="text-sm text-muted-foreground">{block.reference}</li>}
        </ul>
      );
    default:
      return (
        <p className="my-2 leading-loose">
          {block.text}
          {block.reference && <span className="ms-1 text-sm text-muted-foreground">({block.reference})</span>}
        </p>
      );
  }
}

/** Steps topics: each heading starts a numbered step on a vertical timeline. */
function Steps({ blocks }: { blocks: SalahBlock[] }) {
  const lead: SalahBlock[] = [];
  const steps: { title: string; body: SalahBlock[] }[] = [];
  for (const b of blocks) {
    if (b.type === "heading") steps.push({ title: b.text.replace(/^[٠-٩\d]+\)\s*/, ""), body: [] });
    else (steps.at(-1)?.body ?? lead).push(b);
  }
  return (
    <>
      {lead.map((b, i) => (
        <Block key={i} block={b} />
      ))}
      <ol className="relative mt-6">
        {steps.map((s, i) => (
          <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && <span className="absolute start-[1.1rem] top-10 bottom-0 w-px bg-border" />}
            <span className="z-10 grid size-9 shrink-0 place-items-center rounded-full bg-brand font-bold text-white">
              {toLocaleDigits(i + 1, "ar")}
            </span>
            <div className="min-w-0 flex-1 rounded-2xl border bg-card p-4">
              <h3 className="font-bold text-brand">{s.title}</h3>
              {s.body.map((b, j) => (
                <Block key={j} block={b} />
              ))}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

export default async function SalahTopicPage({ params }: PageProps<"/[locale]/salah-guide/[topic]">) {
  const { locale, topic: id } = await params;
  setRequestLocale(locale);
  const [t, all] = await Promise.all([getTranslations("salah-guide"), getSalahTopics()]);
  const index = all.findIndex((x) => x.topic.id === id);
  if (index < 0) notFound();
  const { category, topic } = all[index];
  const position = category.topics.indexOf(topic);
  const next = all[index + 1]?.topic;
  const Icon = CATEGORY_ICON[category.id] ?? BookOpen;

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/salah-guide" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
        <ChevronRight className="size-4 ltr:rotate-180" /> {t("back")}
      </Link>
      <header className="hero-gradient rounded-2xl p-5 text-white sm:p-7" dir="rtl">
        <p className="flex items-center gap-2 text-sm text-gold">
          <Icon className="size-4" />
          <span>{category.title}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/80">
            {toLocaleDigits(position + 1, "ar")} من {toLocaleDigits(category.topics.length, "ar")}
          </span>
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{topic.question}</h1>
        {topic.intro && <p className="mt-3 leading-loose text-white/85">{topic.intro}</p>}
      </header>
      <div className="mt-6 text-[1.05rem]" dir="rtl">
        {topic.steps ? (
          <Steps blocks={topic.blocks} />
        ) : (
          topic.blocks.map((b, i) => <Block key={i} block={b} />)
        )}
      </div>
      <TopicActions id={topic.id} next={next && { id: next.id, question: next.question }} />
    </article>
  );
}
