"use client";

import { BookOpenCheck, Brain } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { CopyShareButtons } from "@/components/hadith/copy-button";
import { cn } from "@/lib/utils";
import { useNawawiProgress } from "./use-nawawi-progress";

/** Read / memorized toggles plus copy & share for one hadith. Opening it marks it read. */
export function NawawiActions({ number, copy }: { number: number; copy: string }) {
  const t = useTranslations("nawawi");
  const { read, memorized, toggleRead, toggleMemorized } = useNawawiProgress();
  const isRead = read.includes(number);
  const isMem = memorized.includes(number);

  useEffect(() => {
    toggleRead(number, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [number]);

  const btn = (on: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
      on ? "border-brand bg-brand/10 text-brand" : "text-muted-foreground hover:border-brand/50 hover:text-brand",
    );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" aria-pressed={isRead} onClick={() => toggleRead(number)} className={btn(isRead)}>
        <BookOpenCheck className="size-3.5" />
        {t("markRead")}
      </button>
      <button type="button" aria-pressed={isMem} onClick={() => toggleMemorized(number)} className={btn(isMem)}>
        <Brain className="size-3.5" />
        {t("markMemorized")}
      </button>
      <CopyShareButtons text={copy} />
    </div>
  );
}
