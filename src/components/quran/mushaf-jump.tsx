"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Props = {
  page: number;
  surahs: { n: number; page: number }[];
  surahName: (n: number) => string;
  juzPages: number[];
};

const selectClass = "h-10 w-full rounded-lg border bg-card px-3 text-sm";

/** Go to a page, surah or juz. */
export function MushafJump({ page, surahs, surahName, juzPages }: Props) {
  const t = useTranslations("quran");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(page));

  const go = (p: number) => {
    if (!(p >= 1 && p <= 604)) return;
    setOpen(false);
    router.push(`/quran/page/${p}`);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setValue(String(page));
      }}
    >
      <SheetTrigger
        render={
          <button
            type="button"
            aria-label={t("jump")}
            title={t("jump")}
            className="grid size-8 place-items-center rounded-full text-brand hover:bg-brand/10"
          />
        }
      >
        <Search className="size-4" />
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-2xl p-5">
        <SheetHeader className="p-0">
          <SheetTitle>{t("jump")}</SheetTitle>
        </SheetHeader>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            go(Number(value));
          }}
        >
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-muted-foreground">{t("goToPage")} ({toLocaleDigits(1, locale)}–{toLocaleDigits(604, locale)})</span>
            <Input type="number" min={1} max={604} inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} className="h-10" />
          </label>
          <Button type="submit" className="h-10">{t("go")}</Button>
        </form>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">{t("surah")}</span>
          <select className={selectClass} defaultValue="" onChange={(e) => go(surahs[Number(e.target.value) - 1].page)}>
            <option value="" disabled>—</option>
            {surahs.map((s) => (
              <option key={s.n} value={s.n}>
                {toLocaleDigits(s.n, locale)}. {surahName(s.n)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">{t("juzLabel")}</span>
          <select className={selectClass} defaultValue="" onChange={(e) => go(juzPages[Number(e.target.value) - 1])}>
            <option value="" disabled>—</option>
            {juzPages.map((p, i) => (
              <option key={i} value={i + 1}>
                {t("juz", { n: toLocaleDigits(i + 1, locale) })} — {t("page", { n: toLocaleDigits(p, locale) })}
              </option>
            ))}
          </select>
        </label>
      </SheetContent>
    </Sheet>
  );
}
