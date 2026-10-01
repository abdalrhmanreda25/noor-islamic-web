"use client";

import { ChevronLeft, ChevronRight, CirclePlay } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";

/** Hero banner: progress ring, count read, content subtitle, continue row. */
export function FiqhProgressCard({
  subtitle,
  read,
  total,
  next,
}: {
  subtitle: string;
  read: number;
  total: number;
  next: { href: string; question: string } | null;
}) {
  const t = useTranslations("fiqh");
  const locale = useLocale();
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;
  const ratio = total ? read / total : 0;
  const r = 28;
  const c = 2 * Math.PI * r;
  return (
    <section className="hero-gradient relative overflow-hidden rounded-2xl p-5 text-white shadow-xl shadow-primary/30 sm:p-7">
      <div className="flex items-center gap-4">
        <div className="relative grid size-16 shrink-0 place-items-center sm:size-20">
          <svg viewBox="0 0 64 64" className="absolute inset-0 size-full -rotate-90">
            <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-white/20" />
            <circle
              cx="32" cy="32" r={r} fill="none" strokeWidth="6" strokeLinecap="round"
              className="stroke-gold transition-[stroke-dashoffset] duration-500"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - ratio)}
            />
          </svg>
          <span className="text-sm font-extrabold tabular-nums sm:text-base">
            {toLocaleDigits(Math.round(ratio * 100), locale)}
            {locale === "ar" ? "٪" : "%"}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-lg font-extrabold sm:text-xl">
            {read === total && total > 0
              ? t("allDone")
              : t("progress", { read: toLocaleDigits(read, locale), total: toLocaleDigits(total, locale) })}
          </p>
          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-white/80"><bdi>{subtitle}</bdi></p>
        </div>
      </div>
      {next && (
        <Link
          href={next.href}
          className="mt-4 flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 transition hover:bg-white/15"
        >
          <CirclePlay className="size-6 shrink-0 text-gold" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-gold">{read > 0 ? t("continue") : t("start")}</span>
            <span className="block truncate font-bold"><bdi>{next.question}</bdi></span>
          </span>
          <Chevron className="size-5 shrink-0 text-white/70" />
        </Link>
      )}
    </section>
  );
}
