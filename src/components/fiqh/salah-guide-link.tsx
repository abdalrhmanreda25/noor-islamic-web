import { ChevronLeft, ChevronRight, Droplet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Points to the Salah Guide, where purification and prayer are covered. */
export function FiqhSalahGuideLink() {
  const t = useTranslations("fiqh");
  const Chevron = useLocale() === "ar" ? ChevronLeft : ChevronRight;
  return (
    <Link
      href="/salah-guide"
      className="flex items-center gap-3 rounded-2xl border bg-secondary/60 p-4 transition hover:border-brand/50"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold/20 text-brand">
        <Droplet className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold text-brand">{t("salahTitle")}</span>
        <span className="block text-xs leading-relaxed text-muted-foreground">{t("salahDesc")}</span>
      </span>
      <Chevron className="size-5 shrink-0 text-brand" />
    </Link>
  );
}
