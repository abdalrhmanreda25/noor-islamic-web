"use client";

import { History, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { QuizModeIcon } from "./meta";
import { HISTORY_LIMIT, ratio, scoreTier, TIER_TEXT, type HistoryEntry } from "./session";

export function QuizHistory({ history, onClear }: { history: HistoryEntry[]; onClear: () => void }) {
  const t = useTranslations("quiz");
  const locale = useLocale();
  const n = (v: number) => toLocaleDigits(v, locale);
  const [confirm, setConfirm] = useState(false);
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-4">
      <div className="flex min-h-8 items-center gap-2">
        <p className="flex-1 text-sm text-muted-foreground">
          {history.length > 0 && t("historyRecent", { n: n(HISTORY_LIMIT) })}
        </p>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirm(true)}>
            <Trash2 />
            {t("clearHistory")}
          </Button>
        )}
      </div>
      {history.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
          <History className="mx-auto mb-3 size-12 opacity-40" />
          {t("historyEmpty")}
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
            {history.map((e, i) => {
              const tier = scoreTier(ratio(e.s, e.t));
              const date = new Date(e.d);
              return (
                <div key={`${e.d}-${i}`} className="flex items-center gap-3 rounded-2xl border bg-card p-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/15">
                    <QuizModeIcon mode={e.m} category={e.c} className="size-5 text-gold" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">
                      {e.c && e.m !== "mixed" && e.m !== "daily"
                        ? t(`categories.${e.c}.title`)
                        : t(`modes.${e.m}`)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {Number.isNaN(date.getTime()) ? "" : fmt.format(date)}
                    </span>
                  </span>
                  <span
                    dir="ltr"
                    className={cn(
                      "rounded-full bg-current/10 px-3 py-1 text-sm font-extrabold tabular-nums",
                      TIER_TEXT[tier],
                    )}
                  >
                    {n(e.s)}/{n(e.t)}
                  </span>
                </div>
              );
            })}
          </div>
      )}

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("clearTitle")}</DialogTitle>
            <DialogDescription>{t("clearBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>{t("cancel")}</DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                onClear();
                setConfirm(false);
              }}
            >
              {t("clear")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
