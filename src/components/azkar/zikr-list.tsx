"use client";

import { Check, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { markAzkarRead } from "@/components/azkar-tracker/storage";
import { toLocaleDigits } from "@/components/page-header";
import type { ZikrCategory } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * Tap a card to count down its repetitions, like the Flutter azkar screen.
 * With `trackerId`, finishing every item marks that category read today in the azkar tracker.
 */
export function ZikrList({ items, trackerId }: { items: ZikrCategory["items"]; trackerId?: string }) {
  const t = useTranslations("azkar");
  const locale = useLocale();
  const [counts, setCounts] = useState(() => items.map(() => 0));
  const done = counts.filter((c, i) => c >= items[i].count).length;

  return (
    <>
      <div className="sticky top-14 z-30 -mx-4 mb-4 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-brand transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
        </div>
        <span className="text-sm tabular-nums">
          {done === items.length
            ? t("completed")
            : t("progress", { done: toLocaleDigits(done, locale), total: toLocaleDigits(items.length, locale) })}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setCounts(items.map(() => 0))}>
          <RotateCcw /> {t("reset")}
        </Button>
      </div>
      <div className="space-y-4">
        {items.map((z, i) => {
          const finished = counts[i] >= z.count;
          return (
            <button
              key={i}
              type="button"
              disabled={finished}
              onClick={() => {
                const next = counts.map((v, j) => (j === i ? v + 1 : v));
                setCounts(next);
                if (trackerId && next.every((v, j) => v >= items[j].count)) markAzkarRead(trackerId);
              }}
              className={cn(
                "block w-full rounded-2xl border bg-card p-5 text-start transition active:scale-[0.99]",
                finished ? "opacity-60" : "hover:border-brand/50",
              )}
              dir="rtl"
            >
              <p className="whitespace-pre-line text-lg leading-loose">{z.content}</p>
              {z.description && <p className="mt-3 text-sm text-brand">{z.description}</p>}
              {z.reference && <p className="mt-1 text-xs text-muted-foreground">{z.reference}</p>}
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <span className="text-sm text-muted-foreground">
                  {t("repeat", { count: toLocaleDigits(z.count, locale) })}
                </span>
                <span
                  className={cn(
                    "grid min-w-12 place-items-center rounded-full px-3 py-1 text-sm font-bold tabular-nums",
                    finished ? "bg-brand text-white" : "bg-secondary",
                  )}
                >
                  {finished ? <Check className="size-4" /> : toLocaleDigits(z.count - counts[i], locale)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
