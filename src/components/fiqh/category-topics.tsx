"use client";

import { useLocale, useTranslations } from "next-intl";
import { toLocaleDigits } from "@/components/page-header";
import type { FiqhCategory } from "@/lib/data/fiqh";
import { FiqhTopicTile } from "./topic-tile";
import { useFiqhRead } from "./use-fiqh-read";

/** Topic list of one category with its read progress. */
export function FiqhCategoryTopics({ category }: { category: FiqhCategory }) {
  const t = useTranslations("fiqh");
  const locale = useLocale();
  const { read } = useFiqhRead();
  const all = category.topics.length;
  const done = category.topics.filter((x) => read.has(x.id)).length;
  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{t("topicsCount", { count: toLocaleDigits(all, locale) })}</span>
        <span className="font-extrabold tabular-nums text-brand">
          {toLocaleDigits(done, locale)}/{toLocaleDigits(all, locale)}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand/10">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${all ? (done / all) * 100 : 0}%` }} />
      </div>
      <div className="-mx-3 mt-3">
        {category.topics.map((x) => (
          <FiqhTopicTile key={x.id} topic={x} category={category.id} isRead={read.has(x.id)} />
        ))}
      </div>
    </section>
  );
}
