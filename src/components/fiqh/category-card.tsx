"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import type { FiqhCategory, FiqhTopicRef } from "@/lib/data/fiqh";
import { FiqhIcon } from "./icons";
import { FiqhTopicTile } from "./topic-tile";

/** One category: icon, title, done/all with a progress bar, then its (filtered) topics. */
export function FiqhCategoryCard({
  category,
  topics,
  read,
}: {
  category: FiqhCategory;
  topics: FiqhTopicRef[];
  read: Set<string>;
}) {
  const locale = useLocale();
  const all = category.topics.length;
  const done = category.topics.filter((t) => read.has(t.id)).length;
  return (
    <section className="min-w-0 rounded-2xl border bg-card p-5 transition hover:border-brand/50">
      <Link href={`/fiqh/${category.id}`} className="group flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/15 text-brand">
          <FiqhIcon id={category.id} className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-extrabold group-hover:text-brand"><bdi>{category.title}</bdi></span>
          <span className="block truncate text-xs text-muted-foreground"><bdi>{category.subtitle}</bdi></span>
        </span>
        <span className="shrink-0 text-sm font-extrabold tabular-nums text-brand">
          {toLocaleDigits(done, locale)}/{toLocaleDigits(all, locale)}
        </span>
      </Link>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-brand/10">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${all ? (done / all) * 100 : 0}%` }} />
      </div>
      <div className="-mx-3 mt-2">
        {topics.map((t) => (
          <FiqhTopicTile key={t.id} topic={t} category={category.id} isRead={read.has(t.id)} />
        ))}
      </div>
    </section>
  );
}
