import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { PageHeader, toLocaleDigits } from "@/components/page-header";
import { NawawiActions } from "@/components/nawawi/nawawi-actions";
import { routing } from "@/i18n/routing";
import { getNawawi } from "@/lib/data";

export const dynamicParams = false;

export async function generateStaticParams() {
  const list = await getNawawi();
  return routing.locales.flatMap((locale) => list.map((h) => ({ locale, n: String(h.number) })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/nawawi/[n]">) {
  const { n } = await params;
  return { title: (await getNawawi()).find((h) => h.number === Number(n))?.title };
}

export default async function NawawiHadithPage({ params }: PageProps<"/[locale]/nawawi/[n]">) {
  const { locale, n } = await params;
  setRequestLocale(locale);
  const list = await getNawawi();
  const h = list.find((x) => x.number === Number(n));
  if (!h) notFound();
  const [t, tn] = await Promise.all([getTranslations("nawawi"), getTranslations("features")]);
  const prev = list.find((x) => x.number === h.number - 1);
  const next = list.find((x) => x.number === h.number + 1);

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/nawawi" className="text-sm text-brand hover:underline">← {tn("nawawi.title")}</Link>
      <PageHeader title={`${toLocaleDigits(h.number, locale)}. ${h.title}`} />
      <div dir="rtl" className="space-y-5">
        <div className="rounded-2xl border bg-card p-6">
          <p className="text-xl leading-loose">{h.text}</p>
          <div className="mt-4 border-t pt-4">
            <NawawiActions number={h.number} copy={`${h.text}\n\n${h.narrator} — ${h.source}`} />
          </div>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-muted p-4"><dt className="text-muted-foreground">{t("narrator")}</dt><dd className="mt-1 font-medium">{h.narrator}</dd></div>
          <div className="rounded-xl bg-muted p-4"><dt className="text-muted-foreground">{t("source")}</dt><dd className="mt-1 font-medium">{h.source}</dd></div>
        </dl>
        <section>
          <h2 className="mb-2 text-lg font-bold text-brand">{t("explanation")}</h2>
          <p className="whitespace-pre-line leading-loose">{h.explanation}</p>
        </section>
        {h.benefits?.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-bold text-brand">{t("benefits")}</h2>
            <ul className="list-disc space-y-1 ps-6 leading-loose">{h.benefits.map((b) => <li key={b}>{b}</li>)}</ul>
          </section>
        )}
        {h.topics?.length > 0 && (
          <div className="flex flex-wrap gap-2">{h.topics.map((x) => <Badge key={x} variant="secondary">{x}</Badge>)}</div>
        )}
      </div>
      <nav className="mt-10 flex justify-between">
        {prev ? <Link href={`/nawawi/${prev.number}`} className="rounded-lg border bg-card px-4 py-2 text-sm">{prev.title}</Link> : <span />}
        {next && <Link href={`/nawawi/${next.number}`} className="rounded-lg border bg-card px-4 py-2 text-sm">{next.title}</Link>}
      </nav>
    </article>
  );
}
