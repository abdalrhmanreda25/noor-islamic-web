"use client";

import { ChevronLeft, ChevronRight, Pencil, Plus, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toLocaleDigits } from "@/components/page-header";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Tasbeeh } from "@/lib/data";
import { cn } from "@/lib/utils";

/** All-time total (kept from the first version of this page). */
const TOTAL_KEY = "yusr.tasbeeh";
/** The user's list when edited ({ content, count } with count 0 = no target); null = defaults. */
const ITEMS_KEY = "yusr.tasbeeh.items";
/** Current count per dhikr text. */
const COUNTS_KEY = "yusr.tasbeeh.counts";

const PRESETS = [33, 100, 1000, 0];

type Item = { content: string; count: number; description?: string };

/** Port of TasbeehScreen: counter ring, prev/next, per-dhikr counts, editable list with targets. */
export function TasbeehCounter({ items: defaults }: { items: Tasbeeh[] }) {
  const t = useTranslations("tasbeeh");
  const locale = useLocale();
  const n = (v: number) => toLocaleDigits(v, locale);
  const [custom, setCustom] = useLocalStorage<Item[] | null>(ITEMS_KEY, null);
  const [counts, setCounts] = useLocalStorage<Record<string, number>>(COUNTS_KEY, {});
  const [total, setTotal] = useLocalStorage<number>(TOTAL_KEY, 0);
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState<{ index: number | null; content: string; count: number } | null>(null);
  const [flash, setFlash] = useState(false);

  const items: Item[] = custom?.length ? custom : defaults;
  const i = Math.min(index, items.length - 1);
  const item = items[i];
  const count = counts[item.content] ?? 0;
  const target = item.count;

  const tap = () => {
    const next = count + 1;
    setCounts((c) => ({ ...c, [item.content]: next }));
    setTotal((v) => v + 1);
    if (target > 0 && next % target === 0) {
      setFlash(true);
      navigator.vibrate?.(120);
    } else navigator.vibrate?.(10);
  };

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(false), 2500);
    return () => clearTimeout(id);
  }, [flash]);

  // Space / Enter count when focus is not on a control.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing || (e.target as HTMLElement).closest("input, textarea, button, a")) return;
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const go = (d: number) => setIndex((i + d + items.length) % items.length);
  const resetCurrent = () => setCounts((c) => ({ ...c, [item.content]: 0 }));
  const save = () => {
    if (!editing || !editing.content.trim()) return;
    const entry = { content: editing.content.trim(), count: Math.max(0, Math.floor(editing.count)) };
    const base = items.map((x) => ({ ...x }));
    if (editing.index == null) base.push(entry);
    else base[editing.index] = { ...base[editing.index], ...entry };
    setCustom(base);
    if (editing.index == null) setIndex(base.length - 1);
    setEditing(null);
  };
  const remove = (k: number) => {
    setCustom(items.filter((_, j) => j !== k));
    if (k <= i) setIndex(Math.max(0, i - 1));
  };

  // Within the current round; a just-completed round shows full.
  const inRound = target > 0 ? count % target || (count ? target : 0) : count;
  const progress = target > 0 ? inRound / target : 0;
  const rounds = target > 0 ? Math.floor(count / target) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col items-center rounded-2xl border bg-card p-6">
        <div className="flex w-full items-center justify-between gap-2 text-sm text-muted-foreground">
          <button type="button" onClick={() => go(-1)} aria-label={t("previous")} className="rounded-full p-2 hover:bg-muted">
            <ChevronRight className="size-5 ltr:rotate-180" />
          </button>
          <span>{t("position", { n: n(i + 1), total: n(items.length) })}</span>
          <button type="button" onClick={() => go(1)} aria-label={t("next")} className="rounded-full p-2 hover:bg-muted">
            <ChevronLeft className="size-5 ltr:rotate-180" />
          </button>
        </div>
        <p dir="rtl" className="mt-2 min-h-16 text-center text-2xl font-bold leading-relaxed">
          {item.content}
        </p>
        {item.description && (
          <p dir="rtl" className="mt-1 text-center text-sm text-brand">
            {item.description}
          </p>
        )}

        <button
          type="button"
          onClick={tap}
          aria-label={t("tap")}
          className="relative mt-8 grid size-64 place-items-center rounded-full transition active:scale-95 sm:size-72"
          style={{ background: `conic-gradient(var(--gold) ${progress * 360}deg, var(--muted) 0deg)` }}
        >
          <span className="hero-gradient absolute inset-3 grid place-items-center rounded-full text-white shadow-inner">
            <span>
              <span className="block text-6xl font-bold tabular-nums">{n(inRound)}</span>
              <span className="mt-1 block text-sm text-white/70">{target > 0 ? `/ ${n(target)}` : t("unlimited")}</span>
            </span>
          </span>
        </button>
        <p className={cn("mt-4 min-h-5 text-sm", flash ? "font-bold text-brand" : "text-muted-foreground")}>
          {flash ? t("reached", { count: n(target) }) : t("tap")}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          {target > 0 && <span className="rounded-full bg-secondary px-3 py-1">{t("rounds", { count: n(rounds) })}</span>}
          <span className="rounded-full bg-secondary px-3 py-1">{t("total", { count: n(total) })}</span>
          <Button variant="outline" size="sm" onClick={resetCurrent} disabled={count === 0}>
            <RotateCcw /> {t("reset")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => confirm(t("resetTotalConfirm")) && setTotal(0)} disabled={total === 0}>
            {t("resetTotal")}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Button className="h-10 flex-1 rounded-xl" onClick={() => setEditing({ index: null, content: "", count: 33 })}>
            <Plus /> {t("add")}
          </Button>
          {custom && (
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => {
                setCustom(null);
                setIndex(0);
              }}
            >
              <Undo2 /> {t("restore")}
            </Button>
          )}
        </div>
        {items.map((it, k) => (
          <div
            key={`${k}-${it.content}`}
            className={cn(
              "flex items-center gap-1 rounded-xl border bg-card ps-4 pe-1 text-sm",
              k === i ? "border-brand bg-secondary font-bold" : "hover:border-brand/50",
            )}
          >
            <button type="button" onClick={() => setIndex(k)} className="flex min-w-0 flex-1 items-center gap-3 py-3 text-start" dir="rtl">
              <span className="line-clamp-2 flex-1">{it.content}</span>
              <span className="shrink-0 text-xs font-normal text-muted-foreground tabular-nums">
                {n(counts[it.content] ?? 0)}/{it.count > 0 ? n(it.count) : "∞"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setEditing({ index: k, content: it.content, count: it.count })}
              aria-label={t("edit")}
              title={t("edit")}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Pencil className="size-4" />
            </button>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => remove(k)}
                aria-label={t("delete")}
                title={t("delete")}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.index == null ? t("add") : t("edit")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <textarea
                dir="rtl"
                value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                placeholder={t("contentPlaceholder")}
                rows={3}
                className="w-full rounded-xl border bg-transparent p-3 text-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <div>
                <p className="mb-2 text-sm font-medium">{t("target")}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditing({ ...editing, count: p })}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm",
                        editing.count === p ? "border-brand bg-brand text-white" : "hover:border-brand/50",
                      )}
                    >
                      {p ? n(p) : `${t("unlimited")} ∞`}
                    </button>
                  ))}
                  <Input
                    type="number"
                    min={0}
                    value={editing.count || ""}
                    onChange={(e) => setEditing({ ...editing, count: Number(e.target.value) || 0 })}
                    placeholder={t("customTarget")}
                    className="h-8 w-32 rounded-full"
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {editing.count ? t("targetHint", { count: n(editing.count) }) : t("unlimitedHint")}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={save} disabled={!editing?.content.trim()}>
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
