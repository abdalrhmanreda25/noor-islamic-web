"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toLocaleDigits } from "@/components/page-header";
import type { NameOfAllah } from "@/lib/data";

const strip = (s: string) => s.replace(/[ً-ٰٟ]/g, "").toLowerCase();

export function NamesGrid({ names }: { names: NameOfAllah[] }) {
  const t = useTranslations("names");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<NameOfAllah | null>(null);
  const q = strip(query.trim());
  const shown = names
    .map((n, i) => ({ ...n, i: i + 1 }))
    .filter((n) => !q || strip(n.nameOfAllah).includes(q) || n.en.toLowerCase().includes(q));

  return (
    <>
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} className="h-11 ps-9" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {shown.map((n) => (
          <button
            key={n.i}
            type="button"
            onClick={() => setOpen(n)}
            className="rounded-xl border bg-card p-4 text-center transition hover:border-gold hover:shadow-sm"
          >
            <span className="text-xs text-muted-foreground">{toLocaleDigits(n.i, locale)}</span>
            <p className="quran-text text-2xl text-brand" dir="rtl">{n.nameOfAllah}</p>
            <p className="text-xs text-muted-foreground">{n.en}</p>
          </button>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {open && (
            <div dir="rtl" className="space-y-4">
              <DialogTitle className="quran-text text-center text-4xl text-brand">{open.nameOfAllah}</DialogTitle>
              <p className="text-center text-sm text-muted-foreground" dir="ltr">{open.en}</p>
              <section>
                <h3 className="font-bold text-brand">{t("meaning")}</h3>
                <p className="mt-1 leading-loose">{open.meaning}</p>
              </section>
              <section>
                <h3 className="font-bold text-brand">{t("effect")}</h3>
                <p className="mt-1 leading-loose">{open.effect}</p>
              </section>
              {open.evidence && (
                <a
                  href={`/${locale}/quran/${open.evidence.surah}#ayah-${open.evidence.ayah}`}
                  className="block rounded-lg bg-muted p-3 text-sm hover:underline"
                >
                  {t("evidence")}: {toLocaleDigits(open.evidence.surah, "ar")}:{toLocaleDigits(open.evidence.ayah, "ar")}
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
