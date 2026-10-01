import type { ReactNode } from "react";

/** Bottom-docked player shell shared by the reciters, radio and listen pages. */
export function PlayerBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 shadow-[0_-4px_20px_rgb(0_0_0/0.08)] backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-3">{children}</div>
    </div>
  );
}

/** Round primary play button used inside the player bars. */
export function RoundButton({
  children,
  onClick,
  label,
  primary,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={
        primary
          ? "grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition hover:bg-primary/85 disabled:opacity-50"
          : "grid size-9 shrink-0 place-items-center rounded-full text-foreground transition hover:bg-muted disabled:opacity-40"
      }
    >
      {children}
    </button>
  );
}
