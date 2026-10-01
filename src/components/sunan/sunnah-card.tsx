"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toLocaleDigits } from "@/components/page-header";
import type { SunnahItem } from "@/lib/data/sunan";
import { cn } from "@/lib/utils";

/** Plain text for the clipboard: ayah numbers in parentheses, then the reference. */
const plainText = (item: SunnahItem) =>
  [
    item.title,
    item.verses ? item.verses.map((v) => `${v.text} (${toLocaleDigits(v.n, "ar")})`).join(" ") : item.text,
    item.reference,
    item.note,
  ]
    .filter(Boolean)
    .join("\n");

export function SunnahCard({ item }: { item: SunnahItem }) {
  const t = useTranslations("sunan");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plainText(item));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <article
      dir="rtl"
      className={cn(
        "rounded-2xl border bg-card p-5 transition hover:border-brand/50",
        item.featured && "border-gold/60 bg-secondary",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className={cn("text-lg font-bold", item.featured ? "text-gold" : "text-brand")}>{item.title}</h3>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={copy}
          aria-label={copied ? t("copied") : t("copy")}
          title={copied ? t("copied") : t("copy")}
        >
          {copied ? <Check className="text-brand" /> : <Copy />}
        </Button>
      </div>
      {item.verses ? (
        <p className="quran-text mt-3 text-xl sm:text-2xl">
          {item.verses.map((v) => (
            <span key={v.n}>
              {v.text} <span className="ayah-marker">﴿{toLocaleDigits(v.n, "ar")}﴾</span>{" "}
            </span>
          ))}
        </p>
      ) : (
        <p className="mt-3 text-lg leading-loose">{item.text}</p>
      )}
      {item.reference && <p className="mt-2 text-sm text-muted-foreground">{item.reference}</p>}
      {item.note && (
        <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm leading-relaxed text-foreground/80">{item.note}</p>
      )}
    </article>
  );
}
