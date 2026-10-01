"use client";

import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { QuizCategoryId } from "@/lib/data/quiz";
import {
  dayKey,
  HISTORY_LIMIT,
  type DailyResult,
  type HistoryEntry,
  type QuizSession,
  type QuizStats,
} from "./session";

const EMPTY_STATS: QuizStats = { rounds: 0, answered: 0, correct: 0, bestStreak: 0 };
const EMPTY_MAP: Partial<Record<QuizCategoryId, number>> = {};

/** Persisted quiz state (port of islamic_quiz_prefs.dart), all under `yusr.quiz.*`. */
export function useQuizStore() {
  const [stats, setStats] = useLocalStorage("yusr.quiz.stats", EMPTY_STATS);
  const [best, setBest] = useLocalStorage("yusr.quiz.best", EMPTY_MAP);
  const [plays, setPlays] = useLocalStorage("yusr.quiz.plays", EMPTY_MAP);
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>("yusr.quiz.history", []);
  const [daily, setDaily] = useLocalStorage<DailyResult | null>("yusr.quiz.daily", null);
  const [timer, setTimer] = useLocalStorage("yusr.quiz.timer", false);

  /** Records a finished round; returns whether it beat the category best. Review rounds aren't counted. */
  const record = useCallback(
    (s: QuizSession): boolean => {
      if (s.mode === "review") return false;
      const now = new Date();
      const total = s.questions.length;
      setStats((old) => ({
        rounds: old.rounds + 1,
        answered: old.answered + total,
        correct: old.correct + s.score,
        bestStreak: Math.max(old.bestStreak, s.bestStreak),
      }));
      let newBest = false;
      const cat = s.category;
      if (s.mode === "category" && cat) {
        setPlays((p) => ({ ...p, [cat]: (p[cat] ?? 0) + 1 }));
        if (s.score > (best[cat] ?? 0)) {
          newBest = true;
          setBest((b) => ({ ...b, [cat]: s.score }));
        }
      }
      if (s.mode === "daily") {
        const day = dayKey(now);
        setDaily((d) => (d?.day === day ? d : { day, score: s.score, total }));
      }
      const entry: HistoryEntry = { d: now.toISOString(), m: s.mode, s: s.score, t: total };
      if (cat) entry.c = cat;
      setHistory((h) => [entry, ...(Array.isArray(h) ? h : [])].slice(0, HISTORY_LIMIT));
      return newBest;
    },
    [best, setBest, setDaily, setHistory, setPlays, setStats],
  );

  return {
    stats: { ...EMPTY_STATS, ...stats },
    best,
    plays,
    history: Array.isArray(history) ? history : [],
    daily,
    timer: timer === true,
    setTimer,
    clearHistory: () => setHistory([]),
    record,
  };
}
