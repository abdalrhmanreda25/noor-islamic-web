"use client";

import { ArrowLeft, ArrowRight, Check, CircleCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useFiqhRead } from "./use-fiqh-read";

type Ref = { href: string; question: string } | null;

/** Footer: "mark as read" toggle, "next topic" (also marks this one read), and prev/next links. */
export function FiqhTopicActions({ id, prev, next }: { id: string; prev: Ref; next: Ref }) {
  const t = useTranslations("fiqh");
  const rtl = useLocale() === "ar";
  const router = useRouter();
  const { read, setRead, loaded } = useFiqhRead();
  const isRead = read.has(id);
  const Next = rtl ? ArrowLeft : ArrowRight;
  const Prev = rtl ? ArrowRight : ArrowLeft;

  return (
    <div className="mt-10 space-y-4">
      <div className="sticky bottom-3 z-10 flex gap-3 rounded-2xl border bg-background/90 p-3 shadow-lg backdrop-blur">
        <button
          type="button"
          disabled={!loaded}
          onClick={() => setRead(id, !isRead)}
          className={cn(
            "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition",
            isRead ? "bg-brand/15 text-brand" : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {isRead ? <CircleCheck className="size-5" /> : <Check className="size-5" />}
          {isRead ? t("read") : t("markRead")}
        </button>
        {next && (
          <button
            type="button"
            onClick={() => {
              setRead(id, true);
              router.push(next.href);
            }}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-brand px-3 text-sm font-bold text-brand transition hover:bg-brand/10"
          >
            {t("next")}
            <Next className="size-5" />
          </button>
        )}
      </div>
      <nav className="grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link href={prev.href} className="rounded-2xl border bg-card p-4 transition hover:border-brand/50">
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Prev className="size-3.5" />{t("prev")}</span>
            <span className="mt-1 block font-bold"><bdi>{prev.question}</bdi></span>
          </Link>
        ) : <span className="hidden sm:block" />}
        {next && (
          <Link href={next.href} className="rounded-2xl border bg-card p-4 text-end transition hover:border-brand/50">
            <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">{t("next")}<Next className="size-3.5" /></span>
            <span className="mt-1 block font-bold"><bdi>{next.question}</bdi></span>
          </Link>
        )}
      </nav>
    </div>
  );
}
