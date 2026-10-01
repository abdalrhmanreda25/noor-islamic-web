"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { toLocaleDigits } from "@/components/page-header";
import { normalizeSearch } from "@/components/audio/normalize";
import type { ReciterEntry } from "@/lib/data/reciters";
import { ReciterAvatar } from "./reciter-avatar";

export function ReciterList({ reciters }: { reciters: ReciterEntry[] }) {
  const t = useTranslations("reciters");
  const locale = useLocale();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return reciters;
    return reciters.filter((r) => normalizeSearch(r.name).includes(q) || normalizeSearch(r.nameEn).includes(q));
  }, [query, reciters]);

  return (
    <>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} className="h-11 ps-9" />
      </div>
      <p className="mb-3 text-sm text-muted-foreground">{t("count", { n: toLocaleDigits(visible.length, locale) })}</p>
      {visible.length === 0 && <p className="py-10 text-center text-muted-foreground">{t("noResults")}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((r) => {
          const name = locale === "ar" ? r.name : r.nameEn;
          const m = r.moshaf[0];
          return (
            <Link
              key={r.id}
              href={`/reciters/${r.id}`}
              className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:border-brand/50 hover:shadow-sm"
            >
              <ReciterAvatar name={name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {locale === "ar" ? m.name : m.nameEn}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                {r.moshaf.length > 1
                  ? t("moshafCount", { n: toLocaleDigits(r.moshaf.length, locale) })
                  : t("surahCount", { n: toLocaleDigits(m.total, locale) })}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
