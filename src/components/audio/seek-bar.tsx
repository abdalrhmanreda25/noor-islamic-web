"use client";

import { formatTime } from "./use-audio";

/** Range input with elapsed / total time; LTR so it fills left-to-right in both locales like a media bar. */
export function SeekBar({
  time,
  duration,
  onSeek,
  locale,
}: {
  time: number;
  duration: number;
  onSeek: (t: number) => void;
  locale: string;
}) {
  return (
    <div dir="ltr" className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
      <span className="w-10 text-start">{formatTime(time, locale)}</span>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(time, duration || 0)}
        disabled={!duration}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="seek"
        className="h-1.5 min-w-0 flex-1 cursor-pointer accent-brand disabled:cursor-default"
      />
      <span className="w-10 text-end">{formatTime(duration, locale)}</span>
    </div>
  );
}
