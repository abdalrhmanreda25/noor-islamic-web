"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { FiqhIndex } from "@/lib/data/fiqh";
import { cn } from "@/lib/utils";
import { FiqhCategoryCard } from "./category-card";
import { FiqhIcon } from "./icons";
import { normalizeArabic } from "./normalize";
import { FiqhProgressCard } from "./progress-card";
import { FiqhSalahGuideLink } from "./salah-guide-link";
import { useFiqhRead } from "./use-fiqh-read";

/** Index: progress, full-text search, category / unread filter, categories. */
export function FiqhBrowser({ data, searchIndex }: { data: FiqhIndex; searchIndex: Record<string, string> }) {
  const t = useTranslations("fiqh");
  const { read: stored } = useFiqhRead();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const order = data.categories.flatMap((c) => c.topics.map((x) => ({ ...x, category: c.id })));
  // Ids of topics removed from the content don't count.
  const read = new Set(order.filter((x) => stored.has(x.id)).map((x) => x.id));
  const total = order.length;
  const first = order.find((x) => !read.has(x.id));
  const next = first ? { href: `/fiqh/${first.category}/${first.id}`, question: first.question } : null;

  const q = normalizeArabic(query.trim()).replace(/\s+/g, " ");
  const filtering = !!q || unreadOnly || categoryId != null;
  const sections = data.categories
    .filter((c) => categoryId == null || c.id === categoryId)
    .map((c) => ({
      category: c,
      topics: c.topics.filter((x) => (!unreadOnly || !read.has(x.id)) && (!q || searchIndex[x.id]?.includes(q))),
    }))
    .filter((s) => s.topics.length > 0);

  const chip = (active: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold transition",
      active ? "border-primary bg-primary text-primary-foreground" : "border-brand/25 bg-brand/5 text-brand hover:bg-brand/10",
    );

  return (
    <div className="space-y-4">
      <FiqhProgressCard subtitle={data.subtitle} read={read.size} total={total} next={next} />

      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          className="h-11 rounded-xl bg-card ps-9 pe-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="clear"
            className="absolute end-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        <button type="button" className={chip(unreadOnly)} onClick={() => setUnreadOnly((v) => !v)}>
          {unreadOnly ? t("unreadCount", { count: total - read.size }) : t("unread")}
        </button>
        <span className="my-1.5 w-px shrink-0 bg-brand/20" />
        <button type="button" className={chip(categoryId == null)} onClick={() => setCategoryId(null)}>
          {t("all")}
        </button>
        {data.categories.map((c) => {
          return (
            <button
              key={c.id}
              type="button"
              className={chip(categoryId === c.id)}
              onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
            >
              <FiqhIcon id={c.id} className="size-4" />
              <bdi>{c.title}</bdi>
            </button>
          );
        })}
      </div>

      {sections.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          {unreadOnly && !q ? t("allRead") : t("noResults")}
        </p>
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
          {sections.map((s) => (
            <FiqhCategoryCard key={s.category.id} category={s.category} topics={s.topics} read={read} />
          ))}
        </div>
      )}
      {!filtering && <FiqhSalahGuideLink />}
    </div>
  );
}
