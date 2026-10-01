"use client";

import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { dayKey } from "@/components/prayer-tracker/dates";
import { AZKAR_LOG_KEY, type AzkarLog } from "@/components/azkar-tracker/storage";
import { useLocalStorage } from "@/hooks/use-local-storage";

/** "Read today" badge from the azkar tracker log. */
export function TodayBadge({ trackerId }: { trackerId: string }) {
  const t = useTranslations("azkar");
  const [log, , loaded] = useLocalStorage<AzkarLog>(AZKAR_LOG_KEY, {});
  if (!loaded || !log[dayKey(new Date())]?.[trackerId]) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
      <CircleCheck className="size-3.5" /> {t("readToday")}
    </span>
  );
}
