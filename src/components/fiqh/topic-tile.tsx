"use client";

import { ChevronLeft, ChevronRight, Circle, CircleCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { FiqhTopicRef } from "@/lib/data/fiqh";
import { cn } from "@/lib/utils";

/** A topic row: read check, question, and a "step by step" badge. */
export function FiqhTopicTile({ topic, category, isRead }: { topic: FiqhTopicRef; category: string; isRead: boolean }) {
  const t = useTranslations("fiqh");
  const Chevron = useLocale() === "ar" ? ChevronLeft : ChevronRight;
  const Check = isRead ? CircleCheck : Circle;
  return (
    <Link
      href={`/fiqh/${category}/${topic.id}`}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-secondary"
    >
      <Check className={cn("size-5 shrink-0", isRead ? "text-brand" : "text-brand/35")} />
      <span className="min-w-0 flex-1 font-medium"><bdi>{topic.question}</bdi></span>
      {topic.steps && (
        <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-brand">
          {t("stepByStep")}
        </span>
      )}
      <Chevron className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
