// Pure quiz round logic, ported from the Flutter QuizSession / IslamicQuizCubit
// (lib/features/islamic_quiz/logic). No React, no storage.
import type { QuizCategoryId, QuizQuestion } from "@/lib/data/quiz";

export const QUESTIONS_PER_ROUND = 10;
export const SECONDS_PER_QUESTION = 30;
export const HISTORY_LIMIT = 30;
/** Stored as the pick when the timer ran out. */
export const TIMED_OUT = -1;

export type QuizMode = "category" | "mixed" | "daily" | "review";
export type BankQuestion = QuizQuestion & { cat: QuizCategoryId };
/** A question for one round: choices shuffled, `a` re-indexed. */
export type SessionQuestion = BankQuestion;

export type QuizSession = {
  mode: QuizMode;
  category?: QuizCategoryId;
  questions: SessionQuestion[];
  /** null = unanswered, TIMED_OUT = no pick. */
  picks: (number | null)[];
  index: number;
  score: number;
  streak: number;
  bestStreak: number;
  finished: boolean;
};

export type QuizStats = { rounds: number; answered: number; correct: number; bestStreak: number };
export type HistoryEntry = { d: string; m: QuizMode; c?: QuizCategoryId; s: number; t: number };
export type DailyResult = { day: string; score: number; total: number };

/** mulberry32: small seeded PRNG for the daily challenge. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: T[], random: () => number) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function buildSession(
  mode: QuizMode,
  pool: BankQuestion[],
  count: number,
  random: () => number = Math.random,
  category?: QuizCategoryId,
): QuizSession {
  const questions = shuffle(pool, random)
    .slice(0, count)
    .map((q) => {
      const c = shuffle(q.c, random);
      return { ...q, c, a: c.indexOf(q.c[q.a]) };
    });
  return {
    mode,
    category,
    questions,
    picks: questions.map(() => null),
    index: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    finished: false,
  };
}

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const dailySeed = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

/** Locks in `choice` for the current question; returns the same object when ignored. */
export function answer(s: QuizSession, choice: number): QuizSession {
  const q = s.questions[s.index];
  if (!q || s.finished || s.picks[s.index] != null) return s;
  const picks = [...s.picks];
  picks[s.index] = choice;
  const correct = choice === q.a;
  const streak = correct ? s.streak + 1 : 0;
  return {
    ...s,
    picks,
    score: s.score + (correct ? 1 : 0),
    streak,
    bestStreak: Math.max(s.bestStreak, streak),
  };
}

/** Moves on after an answer; finishes after the last question. */
export function next(s: QuizSession): QuizSession {
  if (s.finished || s.picks[s.index] == null) return s;
  return s.index + 1 >= s.questions.length ? { ...s, finished: true } : { ...s, index: s.index + 1 };
}

export const mistakes = (s: QuizSession) =>
  s.questions.flatMap((question, i) => {
    const pick = s.picks[i];
    return pick != null && pick !== question.a ? [{ question, pick }] : [];
  });

export const ratio = (score: number, total: number) => (total === 0 ? 0 : score / total);

/** Score tiers shared by the ring, history tiles and result text. */
export function scoreTier(r: number) {
  if (r >= 0.9) return "excellent" as const;
  if (r >= 0.7) return "great" as const;
  if (r >= 0.5) return "good" as const;
  return "start" as const;
}

export const TIER_TEXT = {
  excellent: "text-brand",
  great: "text-gold",
  good: "text-amber-500",
  start: "text-destructive",
} as const;
