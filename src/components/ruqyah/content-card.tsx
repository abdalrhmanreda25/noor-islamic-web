"use client";

import { Check, Copy, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import type { QuranVerse } from "@/lib/data/night-prayer";
import { cn } from "@/lib/utils";

export type ContentItem = {
  title: string;
  text?: string;
  verses?: QuranVerse[];
  refAr?: string;
  /** Extra lines under the text (benefit, note, hadith source). */
  footnotes: string[];
};

const arDigits = (n: number) => toLocaleDigits(n, "ar");

/**
 * Port of the app's CustomContentCard: a titled Quran passage or hadith with
 * its sources, a copy action and an optional tap-to-count repetition badge.
 */
export function ContentCard({
  item,
  repeat,
  remaining,
  onCount,
  onReset,
}: {
  item: ContentItem;
  repeat?: number;
  remaining?: number;
  onCount?: () => void;
  onReset?: () => void;
}) {
  const t = useTranslations("ruqyah");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const counted = repeat != null && remaining != null && onCount;
  const finished = counted && remaining === 0;

  const plain = item.verses
    ? item.verses.map((v) => `${v.text} (${arDigits(v.ayah)})`).join(" ")
    : (item.text ?? "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText([item.title, plain, ...(item.refAr ? [item.refAr] : []), ...item.footnotes].join("\n\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <article className={cn("rounded-2xl border bg-card transition", finished ? "opacity-70" : "hover:border-brand/50")}>
      <header className="flex items-center justify-between gap-2 border-b px-5 py-3" dir="rtl">
        <h3 className="font-bold text-brand">{item.title}</h3>
        <button
          type="button"
          onClick={copy}
          aria-label={t("copy")}
          title={t("copy")}
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          {copied ? <Check className="size-4 text-brand" /> : <Copy className="size-4" />}
        </button>
      </header>
      <div className="px-5 py-4" dir="rtl">
        {item.verses ? (
          <p className="quran-text text-xl sm:text-2xl">
            {item.verses.map((v) => (
              <span key={`${v.surah}:${v.ayah}`}>
                {v.text} <span className="ayah-marker">﴿{arDigits(v.ayah)}﴾</span>{" "}
              </span>
            ))}
          </p>
        ) : (
          <p className="whitespace-pre-line text-lg leading-loose">{item.text}</p>
        )}
        {(item.refAr || item.footnotes.length > 0) && (
          <div className="mt-3 space-y-1 border-t pt-3 text-sm text-muted-foreground">
            {item.refAr && <p className="font-medium text-gold">{item.refAr}</p>}
            {item.footnotes.map((f) => (
              <p key={f}>{f}</p>
            ))}
          </div>
        )}
      </div>
      {counted && (
        <footer className="flex items-center justify-between gap-2 border-t px-5 py-3">
          <span className="text-sm text-muted-foreground">
            {t("repeat", { count: toLocaleDigits(repeat, locale) })}
          </span>
          <div className="flex items-center gap-1">
            {remaining !== repeat && onReset && (
              <button
                type="button"
                onClick={onReset}
                aria-label={t("reset")}
                className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <RotateCcw className="size-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onCount}
              disabled={!!finished}
              className={cn(
                "grid h-9 min-w-14 place-items-center rounded-full px-4 text-sm font-bold tabular-nums transition active:scale-95",
                finished ? "bg-brand text-white" : "bg-secondary hover:bg-brand/15",
              )}
            >
              {finished ? <Check className="size-4" /> : toLocaleDigits(remaining, locale)}
            </button>
          </div>
        </footer>
      )}
    </article>
  );
}

/** Repetitions still owed per key, for a list of counted cards. */
export function useCounters() {
  const [remaining, setRemaining] = useState<Record<string, number>>({});
  return {
    remaining,
    left: (key: string, repeat: number) => remaining[key] ?? repeat,
    count: (key: string, repeat: number) =>
      setRemaining((r) => ({ ...r, [key]: Math.max(0, (r[key] ?? repeat) - 1) })),
    reset: (key: string) =>
      setRemaining((r) => {
        const { [key]: _, ...rest } = r;
        void _;
        return rest;
      }),
    resetAll: () => setRemaining({}),
  };
}
