import { BookOpen, CalendarDays, Landmark, LibraryBig } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { toLocaleDigits } from "@/components/page-header";

/** The app's SeerahHeader: dark-green banner, ﷺ watermark and a gold stats bar. */
export async function SeerahHero({ chapters, lessons }: { chapters: number; lessons: number }) {
  const [t, tf, locale] = await Promise.all([getTranslations("seerah"), getTranslations("features"), getLocale()]);
  const stats = [
    { icon: LibraryBig, label: t("chapters", { n: chapters, count: toLocaleDigits(chapters, locale) }) },
    { icon: BookOpen, label: t("lessons", { n: lessons, count: toLocaleDigits(lessons, locale) }) },
    { icon: CalendarDays, label: t("years") },
  ];
  return (
    <div className="relative mb-12">
      <section className="hero-gradient relative overflow-hidden rounded-3xl px-5 pt-8 pb-14 text-center text-white shadow-xl shadow-primary/30">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-6 select-none text-[10rem] leading-none text-white/[0.07] motion-safe:animate-pulse"
        >
          ﷺ
        </span>
        <div className="relative mx-auto grid size-18 place-items-center rounded-2xl border-[2.5px] border-gold bg-white/10">
          <Landmark className="size-9 text-gold" />
        </div>
        <h1 className="relative mt-4 text-3xl font-black sm:text-4xl">{tf("seerah.title")}</h1>
        <p className="relative mt-2 text-white/85">{t("tagline")}</p>
      </section>
      <div className="absolute inset-x-0 -bottom-6 mx-auto flex w-[92%] max-w-2xl flex-wrap items-center justify-evenly gap-x-4 gap-y-1 rounded-xl bg-gold px-3 py-3.5 text-xs font-bold text-primary shadow-lg sm:text-sm dark:text-primary-foreground">
        {stats.map(({ icon: Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <Icon className="size-4" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
