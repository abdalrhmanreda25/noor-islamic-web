"use client";

import { BookOpenCheck, Brain, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { normalizeArabic } from "@/components/hadith/book-search";
import { toLocaleDigits } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import type { NawawiHadith } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useNawawiProgress } from "./use-nawawi-progress";

type Status = "all" | "memorized" | "unread";

/** Index of the forty: progress banner, search, topic + status filters. */
export function NawawiBrowser({ list, title }: { list: NawawiHadith[]; title: string }) {
  const t = useTranslations("nawawi");
  const locale = useLocale();
  const { read, memorized } = useNawawiProgress();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("all");
  const topics = [...new Set(list.flatMap((h) => h.topics ?? []))];

  const digits = query.trim().replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
  const q = normalizeArabic(digits);
  const shown = list.filter((h) => {
    if (topic && !h.topics?.includes(topic)) return false;
    if (status === "memorized" && !memorized.includes(h.number)) return false;
    if (status === "unread" && read.includes(h.number)) return false;
    if (!q) return true;
    if (/^\d+$/.test(q)) return h.number === Number(q);
    return normalizeArabic([h.title, h.text, h.narrator, h.explanation, ...(h.benefits ?? []), ...(h.topics ?? [])].join(" ")).includes(q);
  });
  const next = list.find((h) => !read.includes(h.number));
  const pct = Math.round((read.length / list.length) * 100);
  const chip = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
      active ? "border-primary bg-primary text-primary-foreground" : "border-brand/25 bg-brand/5 text-brand hover:border-brand/50",
    );

  return (
    <>
      <section className="hero-gradient mb-5 rounded-2xl p-5 text-white shadow-xl shadow-primary/20 sm:p-7">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-1 text-white/75">{t("subtitle")}</p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-white/80">
            {t("progress", {
              read: toLocaleDigits(read.length, locale),
              total: toLocaleDigits(list.length, locale),
              memorized: toLocaleDigits(memorized.length, locale),
            })}
          </p>
          {next && (
            <Link href={`/nawawi/${next.number}`} className="rounded-full bg-gold px-4 py-1.5 font-medium text-black">
              {read.length ? t("continue", { n: toLocaleDigits(next.number, locale) }) : t("start")}
            </Link>
          )}
        </div>
      </section>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} className="h-11 ps-9" />
      </div>
      <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
        {(["all", "memorized", "unread"] as Status[]).map((s) => (
          <button key={s} type="button" onClick={() => setStatus(s)} className={chip(status === s)}>{t(s)}</button>
        ))}
      </div>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1" dir="rtl">
        <button type="button" onClick={() => setTopic(null)} className={chip(topic === null)}>{t("all")}</button>
        {topics.map((x) => (
          <button key={x} type="button" onClick={() => setTopic(topic === x ? null : x)} className={chip(topic === x)}>{x}</button>
        ))}
      </div>

      {shown.length === 0 && <p className="py-10 text-center text-muted-foreground">{t("noResults")}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" dir="rtl">
        {shown.map((h) => {
          const isRead = read.includes(h.number);
          const isMem = memorized.includes(h.number);
          return (
            <Link
              key={h.number}
              href={`/nawawi/${h.number}`}
              className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:border-brand/50"
            >
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold",
                  isRead ? "bg-primary text-primary-foreground" : "bg-secondary text-brand",
                )}
              >
                {toLocaleDigits(h.number, locale)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{h.title}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{h.narrator}</p>
              </div>
              {isMem ? <Brain className="size-4 shrink-0 text-gold" /> : isRead && <BookOpenCheck className="size-4 shrink-0 text-brand" />}
            </Link>
          );
        })}
      </div>
    </>
  );
}
