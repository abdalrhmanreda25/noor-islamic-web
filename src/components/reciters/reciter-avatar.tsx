import { cn } from "@/lib/utils";

/** Initials medallion (the app's fallback when no portrait is available). */
export function ReciterAvatar({ name, className }: { name: string; className?: string }) {
  const words = name.replace(/^(ال)?(شيخ|الشيخ)\s+/, "").split(/\s+/).filter(Boolean);
  const initials = words.length ? words.slice(0, 2).map((w) => w.replace(/^ال/, "")[0]).join("") : "ق";
  return (
    <span
      className={cn(
        "hero-gradient grid size-12 shrink-0 place-items-center rounded-full font-bold text-gold ring-2 ring-gold/40",
        className,
      )}
    >
      {initials}
    </span>
  );
}
