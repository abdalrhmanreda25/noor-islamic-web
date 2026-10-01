"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { KEYS } from "./shared";

/** Reading progress, as SeerahCubit: finished lesson ids and the last lesson opened. */
export function useSeerahProgress() {
  const [readList, setRead, loaded] = useLocalStorage<string[]>(KEYS.read, []);
  const [last, setLast] = useLocalStorage<string | null>(KEYS.last, null);
  const read = useMemo(() => new Set(readList), [readList]);

  const markRead = useCallback(
    (id: string) => setRead((prev) => (prev.includes(id) ? prev : [...prev, id].sort())),
    [setRead],
  );
  const toggleRead = useCallback(
    (id: string) => setRead((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].sort())),
    [setRead],
  );
  const opened = useCallback((id: string) => setLast(id), [setLast]);

  return { read, last, loaded, markRead, toggleRead, opened };
}
