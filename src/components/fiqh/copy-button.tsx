"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

const noop = () => () => {};

/** Copy (and native share where available) for a verse or hadith. */
export function FiqhEvidenceActions({ text }: { text: string }) {
  const t = useTranslations("fiqh");
  const [copied, setCopied] = useState(false);
  const canShare = useSyncExternalStore(noop, () => typeof navigator.share === "function", () => false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  const share = () => navigator.share({ text }).catch(() => {});
  const btn = "grid size-8 place-items-center rounded-full text-brand transition hover:bg-brand/10";
  return (
    <div className="flex shrink-0 items-center">
      <button type="button" onClick={copy} className={btn} aria-label={t("copy")} title={copied ? t("copied") : t("copy")}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
      {canShare && (
        <button type="button" onClick={share} className={btn} aria-label={t("share")} title={t("share")}>
          <Share2 className="size-4" />
        </button>
      )}
    </div>
  );
}
