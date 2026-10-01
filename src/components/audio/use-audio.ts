"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AudioState = {
  playing: boolean;
  /** Waiting on the network (initial load or stalled stream). */
  loading: boolean;
  time: number;
  duration: number;
  error: boolean;
};

const INITIAL: AudioState = { playing: false, loading: false, time: 0, duration: 0, error: false };

/**
 * Owns one HTMLAudioElement (created lazily, never rendered) and mirrors its
 * state into React. `load(src)` swaps the source and plays; `onEnded` is read
 * from a ref so callers can pass a fresh closure every render.
 */
export function useAudio({ onEnded }: { onEnded?: () => void } = {}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const endedRef = useRef(onEnded);
  const [state, setState] = useState<AudioState>(INITIAL);

  useEffect(() => {
    endedRef.current = onEnded;
  });

  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    ref.current = a;
    const set = (patch: Partial<AudioState>) => setState((s) => ({ ...s, ...patch }));
    const handlers: Record<string, () => void> = {
      play: () => set({ playing: true, error: false }),
      pause: () => set({ playing: false }),
      waiting: () => set({ loading: true }),
      loadstart: () => set({ loading: true, time: 0, duration: 0 }),
      canplay: () => set({ loading: false }),
      playing: () => set({ loading: false, playing: true }),
      timeupdate: () => set({ time: a.currentTime }),
      durationchange: () => set({ duration: Number.isFinite(a.duration) ? a.duration : 0 }),
      error: () => set({ error: true, loading: false, playing: false }),
      ended: () => {
        set({ playing: false });
        endedRef.current?.();
      },
    };
    for (const [e, h] of Object.entries(handlers)) a.addEventListener(e, h);
    return () => {
      for (const [e, h] of Object.entries(handlers)) a.removeEventListener(e, h);
      a.pause();
      a.removeAttribute("src");
      a.load();
      ref.current = null;
    };
  }, []);

  const load = useCallback((src: string, autoplay = true) => {
    const a = ref.current;
    if (!a) return;
    setState((s) => ({ ...s, error: false }));
    a.src = src;
    if (autoplay) a.play().catch(() => {});
  }, []);

  const play = useCallback(() => {
    ref.current?.play().catch(() => {});
  }, []);
  const pause = useCallback(() => ref.current?.pause(), []);
  const stop = useCallback(() => {
    const a = ref.current;
    if (!a) return;
    a.pause();
    a.removeAttribute("src");
    a.load();
    setState(INITIAL);
  }, []);
  const seek = useCallback((t: number) => {
    if (ref.current) ref.current.currentTime = t;
  }, []);
  const preload = useCallback((src: string) => {
    // Warm the HTTP cache for the next file so per-ayah playback has no gap.
    const p = new Audio();
    p.preload = "auto";
    p.src = src;
  }, []);

  return { ...state, load, play, pause, stop, seek, preload, element: ref };
}

export function formatTime(seconds: number, locale: string) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  const text = h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
  return locale === "ar" ? text.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]) : text;
}
