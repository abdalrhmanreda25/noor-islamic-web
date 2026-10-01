"use client";

import { ArrowLeft, History } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
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
import type { QuizBank, QuizCategoryId } from "@/lib/data/quiz";
import { QuizModeIcon } from "./meta";
import { QuizHistory } from "./quiz-history";
import { QuizHome } from "./quiz-home";
import { QuizResult } from "./quiz-result";
import { QuizSessionView } from "./quiz-session-view";
import {
  answer,
  buildSession,
  dailySeed,
  dayKey,
  mistakes,
  next,
  QUESTIONS_PER_ROUND,
  SECONDS_PER_QUESTION,
  seeded,
  TIMED_OUT,
  type BankQuestion,
  type QuizSession,
} from "./session";
import { useQuizStore } from "./use-quiz-store";

type View = "home" | "session" | "history";

/** The whole quiz flow (hub → round → result, plus history) as client state. */
export function QuizApp({ bank }: { bank: QuizBank }) {
  const t = useTranslations("quiz");
  const store = useQuizStore();
  const [view, setView] = useState<View>("home");
  const [session, setSession] = useState<QuizSession | null>(null);
  const [roundId, setRoundId] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const pools = useMemo(() => {
    const byCat = Object.fromEntries(
      bank.map(({ id, questions }) => [id, questions.map((q): BankQuestion => ({ ...q, cat: id }))]),
    ) as Record<QuizCategoryId, BankQuestion[]>;
    return { byCat, all: Object.values(byCat).flat() };
  }, [bank]);

  const go = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0 });
  };

  const start = (s: QuizSession) => {
    if (s.questions.length === 0) return;
    setSession(s);
    setRoundId((r) => r + 1);
    setIsNewBest(false);
    go("session");
  };

  const startCategory = (id: QuizCategoryId) =>
    start(buildSession("category", pools.byCat[id] ?? [], QUESTIONS_PER_ROUND, Math.random, id));
  const startMixed = () => start(buildSession("mixed", pools.all, QUESTIONS_PER_ROUND));
  /** Same 10 questions (and choice order) for everyone on a given day. */
  const startDaily = () =>
    start(buildSession("daily", pools.all, QUESTIONS_PER_ROUND, seeded(dailySeed(new Date()))));

  const retryMistakes = () => {
    if (!session) return;
    // Restore the original question objects (choices get reshuffled anyway).
    const missed = mistakes(session).map((m) => m.question);
    if (missed.length) start(buildSession("review", missed, missed.length, Math.random, session.category));
  };

  const restart = () => {
    if (!session) return;
    if (session.mode === "daily") startDaily();
    else if (session.category && session.mode !== "mixed") startCategory(session.category);
    else startMixed();
  };

  const onSelect = useCallback((i: number) => setSession((s) => (s ? answer(s, i) : s)), []);
  const onTimeout = useCallback(() => setSession((s) => (s ? answer(s, TIMED_OUT) : s)), []);
  const { record } = store;
  const onNext = useCallback(() => {
    if (!session) return;
    const n = next(session);
    if (n === session) return;
    setSession(n);
    if (n.finished) {
      setIsNewBest(record(n));
      window.scrollTo({ top: 0 });
    }
  }, [session, record]);

  const sessionTitle = session
    ? session.category && session.mode !== "mixed" && session.mode !== "daily"
      ? t(`categories.${session.category}.title`)
      : t(`modes.${session.mode}`)
    : t("quiz");

  const back = () => {
    if (view === "session" && session && !session.finished && session.picks.some((p) => p != null)) {
      setLeaveOpen(true);
    } else go("home");
  };

  if (view === "home") {
    return (
      <QuizHome
        bank={bank}
        stats={store.stats}
        best={store.best}
        plays={store.plays}
        daily={store.daily?.day === dayKey(new Date()) ? store.daily : null}
        timer={store.timer}
        onTimer={store.setTimer}
        onHistory={() => go("history")}
        onDaily={startDaily}
        onMixed={startMixed}
        onCategory={startCategory}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="outline" size="icon-lg" className="rounded-xl" onClick={back} aria-label={t("back")}>
          <ArrowLeft className="rtl:rotate-180" />
        </Button>
        {view === "session" && session && (
          <p className="flex min-w-0 items-center gap-2 font-bold">
            <QuizModeIcon mode={session.mode} category={session.category} className="size-5 shrink-0 text-gold" />
            <span className="truncate">{sessionTitle}</span>
          </p>
        )}
        {view === "history" && (
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <History className="size-5 text-gold" />
            {t("historyTitle")}
          </h2>
        )}
      </div>

      {view === "history" && <QuizHistory history={store.history} onClear={store.clearHistory} />}

      {view === "session" && session && !session.finished && (
        <QuizSessionView
          session={session}
          roundId={roundId}
          timerSeconds={store.timer ? SECONDS_PER_QUESTION : null}
          onSelect={onSelect}
          onTimeout={onTimeout}
          onNext={onNext}
        />
      )}

      {view === "session" && session?.finished && (
        <QuizResult
          session={session}
          title={sessionTitle}
          isNewBest={isNewBest}
          onRetryMistakes={retryMistakes}
          onNewRound={restart}
          onBack={() => go("home")}
        />
      )}

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("leaveTitle")}</DialogTitle>
            <DialogDescription>{t("leaveBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>{t("continue")}</DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setLeaveOpen(false);
                go("home");
              }}
            >
              {t("leave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

