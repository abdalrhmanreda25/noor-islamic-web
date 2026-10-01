import { useLocale, useTranslations } from "next-intl";
import { toLocaleDigits } from "@/components/page-header";
import type { Hadith } from "@/lib/data/hadith";
import { cn } from "@/lib/utils";
import { CopyShareButtons } from "./copy-button";

const GRADE_EN: Record<string, string> = {
  "صحيح": "Sahih",
  "حسن": "Hasan",
  "حسن صحيح": "Hasan Sahih",
  "ضعيف": "Da'if",
  "ضعيف جدًا": "Very weak",
  "ضعيف جدا": "Very weak",
  "موضوع": "Fabricated",
  "منكر": "Munkar",
  "شاذ": "Shadh",
  "صحيح الإسناد": "Sahih isnad",
  "ضعيف الإسناد": "Da'if isnad",
  "حسن الإسناد": "Hasan isnad",
  "صحيح لغيره": "Sahih li-ghayrihi",
  "حسن لغيره": "Hasan li-ghayrihi",
};

/** Weak or rejected gradings, flagged like the app does. */
export const isWeakGrade = (grade = "") => ["ضعيف", "موضوع", "منكر", "شاذ"].some((w) => grade.includes(w));

/** Hadith numbers can be "690b" or "622, 623": localize only the digit runs. */
export const hadithNo = (n: string, locale: string) => n.replace(/\d+/g, (d) => toLocaleDigits(d, locale));
export const hadithAnchor = (n: string) => `h-${n.replace(/\W+/g, "-")}`;

/** One hadith: number, grade chip, Arabic text, English (en locale), copy/share. */
export function HadithCard({
  hadith: h,
  gradedBy,
  source,
}: {
  hadith: Hadith;
  /** Whose grading the collection carries (localized). */
  gradedBy?: string;
  /** Appended to copied text, e.g. "صحيح البخاري". */
  source: string;
}) {
  const t = useTranslations("hadith");
  const locale = useLocale();
  const showEn = locale === "en" && !!h.en;
  const weak = isWeakGrade(h.grade);
  const grade = h.grade && (locale === "en" ? (GRADE_EN[h.grade] ?? h.grade) : h.grade);
  const ref = h.number ? `${source} (${hadithNo(h.number, locale)})` : source;
  const copyText = [h.ar, showEn ? h.en : "", `— ${ref}`].filter(Boolean).join("\n\n");

  return (
    <article id={h.number ? hadithAnchor(h.number) : undefined} className="scroll-mt-24 rounded-2xl border bg-card p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {h.number && (
          <span className="rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-brand">
            {t("number", { n: hadithNo(h.number, locale) })}
          </span>
        )}
        {grade && (
          <span
            className={cn(
              "rounded-full border px-3 py-0.5 text-xs font-medium",
              weak ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-brand/30 bg-brand/10 text-brand",
            )}
          >
            {gradedBy ? `${t("gradedBy", { name: gradedBy })}: ` : ""}
            {grade}
          </span>
        )}
      </div>
      <p dir="rtl" lang="ar" className="whitespace-pre-line text-lg leading-loose">{h.ar}</p>
      {showEn && (
        <p dir="ltr" lang="en" className="mt-4 whitespace-pre-line border-t pt-4 leading-relaxed text-muted-foreground">{h.en}</p>
      )}
      <CopyShareButtons text={copyText} title={ref} className="mt-4" />
    </article>
  );
}
