"use client";

import { useCallback, useEffect, useState } from "react";
import type { TrackedSunnah } from "@/lib/data/sunan";

/** Sunnah ids done per local day, stored as `yusr.sunan.<yyyy-mm-dd>` → string[]. */
export type SunanLog = Record<string, string[]>;

const PREFIX = "yusr.sunan.";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Older days are dropped on load, like the app's 90-day log (kept longer here). */
const KEEP_DAYS = 365;

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const parseDay = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function useSunanLog() {
  const [log, setLog] = useState<SunanLog>({});
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const now = new Date();
    const cutoff = dayKey(addDays(now, -KEEP_DAYS));
    const out: SunanLog = {};
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!key?.startsWith(PREFIX)) continue;
        const day = key.slice(PREFIX.length);
        if (!DATE_RE.test(day)) continue;
        if (day < cutoff) {
          localStorage.removeItem(key);
          continue;
        }
        const ids = JSON.parse(localStorage.getItem(key) ?? "[]");
        if (Array.isArray(ids) && ids.length) out[day] = ids.filter((s) => typeof s === "string");
      }
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLog(out);
    setToday(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  }, []);

  /** Toggles `id` on `day` (past days too, for a forgotten log). Future days are ignored. */
  const toggle = useCallback(
    (day: string, id: string) => {
      if (!today || day > dayKey(today)) return;
      setLog((prev) => {
        const cur = prev[day] ?? [];
        const ids = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
        const next = { ...prev };
        if (ids.length) next[day] = ids;
        else delete next[day];
        try {
          if (ids.length) localStorage.setItem(PREFIX + day, JSON.stringify(ids));
          else localStorage.removeItem(PREFIX + day);
        } catch {}
        return next;
      });
    },
    [today],
  );

  return { log, today, toggle };
}

/** Derived numbers, ported from SunanTrackerCubit. */
export function sunanStats(log: SunanLog, today: Date, tracked: TrackedSunnah[]) {
  const rawatib = tracked.filter((s) => s.rakaat > 0);
  const totalRakaat = rawatib.reduce((s, r) => s + r.rakaat, 0);
  const doneOn = (day: string) => log[day] ?? [];
  const rakaatOn = (day: string) =>
    rawatib.filter((s) => doneOn(day).includes(s.id)).reduce((sum, s) => sum + s.rakaat, 0);
  const full = (day: string) => rawatib.every((s) => doneOn(day).includes(s.id));
  const todayKey = dayKey(today);
  const month = todayKey.slice(0, 7);
  const monthDays = Object.keys(log).filter((d) => d.startsWith(month));

  // Consecutive full days ending today, or yesterday if today isn't finished yet.
  let day = full(todayKey) ? today : addDays(today, -1);
  let streak = 0;
  while (full(dayKey(day))) {
    streak++;
    day = addDays(day, -1);
  }

  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of Object.keys(log).filter(full).sort()) {
    const date = parseDay(d);
    run = prev && dayKey(addDays(prev, 1)) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }

  return {
    totalRakaat,
    doneOn,
    rakaatOn,
    streak,
    bestStreak: best,
    fullDaysThisMonth: monthDays.filter(full).length,
    countThisMonth: (id: string) => monthDays.filter((d) => doneOn(d).includes(id)).length,
  };
}
