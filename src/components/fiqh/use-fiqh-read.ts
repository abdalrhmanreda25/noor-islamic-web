"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

/** Ids of topics marked read (the app's `fiqh_read_topics`). */
export function useFiqhRead() {
  const [ids, setIds, loaded] = useLocalStorage<string[]>("yusr.fiqh.read", []);
  const read = useMemo(() => new Set(ids), [ids]);
  const setRead = useCallback(
    (id: string, value: boolean) =>
      setIds((prev) => {
        const has = prev.includes(id);
        if (has === value) return prev;
        return value ? [...prev, id].sort() : prev.filter((x) => x !== id);
      }),
    [setIds],
  );
  return { read, setRead, loaded };
}
