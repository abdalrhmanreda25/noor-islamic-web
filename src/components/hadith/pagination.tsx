import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import { cn } from "@/lib/utils";

/** Page links for a paginated book: page 1 is the book URL, others are /<n>. */
export function Pagination({ base, page, total }: { base: string; page: number; total: number }) {
  const t = useTranslations("hadith");
  const locale = useLocale();
  if (total <= 1) return null;
  const href = (n: number) => (n === 1 ? base : `${base}/${n}`);
  // First, last, and a window around the current page.
  const pages = [...new Set([1, page - 2, page - 1, page, page + 1, page + 2, total])]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const Prev = locale === "ar" ? ChevronRight : ChevronLeft;
  const Next = locale === "ar" ? ChevronLeft : ChevronRight;
  const item = "grid h-9 min-w-9 place-items-center rounded-lg border bg-card px-2 text-sm transition hover:border-brand/50";

  return (
    <nav aria-label={t("page", { n: page, total })} className="mt-8 flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {page > 1 && (
          <Link href={href(page - 1)} className={item} aria-label={t("prev")}><Prev className="size-4" /></Link>
        )}
        {pages.map((n, i) => (
          <span key={n} className="contents">
            {i > 0 && n - pages[i - 1] > 1 && <span className="px-1 text-muted-foreground">…</span>}
            <Link
              href={href(n)}
              aria-current={n === page ? "page" : undefined}
              className={cn(item, n === page && "border-brand bg-primary text-primary-foreground")}
            >
              {toLocaleDigits(n, locale)}
            </Link>
          </span>
        ))}
        {page < total && (
          <Link href={href(page + 1)} className={item} aria-label={t("next")}><Next className="size-4" /></Link>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("page", { n: toLocaleDigits(page, locale), total: toLocaleDigits(total, locale) })}
      </p>
    </nav>
  );
}
