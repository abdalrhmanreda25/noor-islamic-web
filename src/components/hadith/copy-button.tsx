"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const noop = () => () => {};

/** Copy (and, where the browser supports it, share) a block of text. */
export function CopyShareButtons({ text, title, className }: { text: string; title?: string; className?: string }) {
  const t = useTranslations("hadith");
  const [copied, setCopied] = useState(false);
  // false on the server and during hydration, then the real value.
  const canShare = useSyncExternalStore(noop, () => "share" in navigator, () => false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  const share = async () => {
    try {
      await navigator.share({ title, text });
    } catch {}
  };

  const btn = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-brand/50 hover:text-brand";
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <button type="button" onClick={copy} className={btn} aria-live="polite">
        {copied ? <Check className="size-3.5 text-brand" /> : <Copy className="size-3.5" />}
        {copied ? t("copied") : t("copy")}
      </button>
      {canShare && (
        <button type="button" onClick={share} className={btn}>
          <Share2 className="size-3.5" />
          {t("share")}
        </button>
      )}
    </div>
  );
}
