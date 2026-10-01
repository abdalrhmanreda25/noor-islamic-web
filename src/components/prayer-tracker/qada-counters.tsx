"use client";

import { Minus, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toLocaleDigits } from "@/components/page-header";
import { PRAYER_KEYS, type QadaCounts } from "./storage";

/** Port of QadaScreen: outstanding make-up prayers per prayer. */
export function QadaCounters({
  qada,
  setQada,
}: {
  qada: QadaCounts;
  setQada: (fn: (q: QadaCounts) => QadaCounts) => void;
}) {
  const t = useTranslations("prayer-tracker");
  const tp = useTranslations("prayer");
  const locale = useLocale();
  const total = PRAYER_KEYS.reduce((s, p) => s + (qada[p] ?? 0), 0);
  const change = (p: (typeof PRAYER_KEYS)[number], d: number) =>
    setQada((q) => ({ ...q, [p]: Math.max(0, (q[p] ?? 0) + d) }));

  return (
    <div className="space-y-4">
      <div className="hero-gradient rounded-2xl p-5 text-white">
        <p className="text-sm text-white/70">{t("qadaTotal")}</p>
        <p className="mt-1 text-4xl font-bold text-gold">{toLocaleDigits(total, locale)}</p>
        <p className="mt-3 text-sm leading-relaxed text-white/80">{t("qadaHint")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRAYER_KEYS.map((p) => (
          <div key={p} className="flex items-center justify-between rounded-2xl border bg-card p-4">
            <span className="text-lg font-bold">{tp(p)}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => change(p, -1)}
                disabled={!qada[p]}
                aria-label={t("decrease")}
                className="grid size-9 place-items-center rounded-full border hover:bg-muted disabled:opacity-40"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center text-xl font-bold text-brand tabular-nums">
                {toLocaleDigits(qada[p] ?? 0, locale)}
              </span>
              <button
                type="button"
                onClick={() => change(p, 1)}
                aria-label={t("increase")}
                className="grid size-9 place-items-center rounded-full border hover:bg-muted"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
