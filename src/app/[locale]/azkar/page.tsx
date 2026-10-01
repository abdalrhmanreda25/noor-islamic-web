/* eslint-disable @next/next/no-img-element */
import { BookOpen, Fingerprint, ListChecks, Sparkles, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { trackedIdFor } from "@/components/azkar-tracker/storage";
import { TodayBadge } from "@/components/azkar/today-badge";
import { PageHeader, toLocaleDigits } from "@/components/page-header";
import { Link } from "@/i18n/navigation";
import { getAzkar } from "@/lib/data";

/** Category illustrations from the app (assets/azkar/*.svg), by azkar id. */
const ART: Record<number, string> = {
  1: "/icons/azkar/1.svg",
  2: "/icons/azkar/2.svg",
  3: "/icons/azkar/3.svg",
  5: "/icons/azkar/5.svg",
  6: "/icons/azkar/6.svg",
};
const ICON = { 4: Fingerprint, 7: BookOpen, 8: Users } as const;

export async function generateMetadata() {
  return { title: (await getTranslations("nav"))("azkar") };
}

export default async function AzkarPage({ params }: PageProps<"/[locale]/azkar">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, ta, azkar] = await Promise.all([getTranslations("nav"), getTranslations("azkar"), getAzkar()]);
  return (
    <>
      <PageHeader title={t("azkar")} subtitle={ta("subtitle")}>
        <Link
          href="/azkar-tracker"
          className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-sm font-medium hover:border-brand/50"
        >
          <ListChecks className="size-4 text-brand" /> {ta("tracker")}
        </Link>
      </PageHeader>
      <section className="hero-gradient mb-6 rounded-2xl p-5 text-white sm:p-7">
        <p className="flex items-center gap-2 text-sm text-gold">
          <Sparkles className="size-4" /> {ta("heroLabel")}
        </p>
        <p className="mt-3 leading-loose text-white/90">{ta("heroText")}</p>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {azkar.map((c) => {
          const Icon = ICON[c.id as keyof typeof ICON] ?? Sparkles;
          const trackerId = trackedIdFor(c.id);
          return (
            <Link
              key={c.id}
              href={`/azkar/${c.id}`}
              className="flex items-center gap-4 rounded-2xl border bg-card p-5 transition hover:border-brand/50 hover:shadow-sm"
            >
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-secondary p-2.5">
                {ART[c.id] ? (
                  <img src={ART[c.id]} alt="" width={44} height={44} className="size-11 object-contain" />
                ) : (
                  <Icon className="size-8 text-brand" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold" dir="rtl">
                  {c.title}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {ta("items", { count: toLocaleDigits(c.items.length, locale) })}
                  {trackerId && <TodayBadge trackerId={trackerId} />}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
