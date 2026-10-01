"use client";

import { useLocalStorage } from "@/hooks/use-local-storage";

/** Read and memorized hadith numbers, as the app's forty_nawawi prefs. */
export function useNawawiProgress() {
  const [read, setRead] = useLocalStorage<number[]>("yusr.nawawi.read", []);
  const [memorized, setMemorized] = useLocalStorage<number[]>("yusr.nawawi.memorized", []);
  const toggle = (set: typeof setRead) => (n: number, on?: boolean) =>
    set((list) => {
      const has = list.includes(n);
      if (on ?? !has) return has ? list : [...list, n].sort((a, b) => a - b);
      return list.filter((x) => x !== n);
    });
  return { read, memorized, toggleRead: toggle(setRead), toggleMemorized: toggle(setMemorized) };
}
