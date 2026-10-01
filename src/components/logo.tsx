import { cn } from "@/lib/utils";

/** Yusr calligraphy mark; drawn as a mask so it follows the current text color. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-8 bg-current", className)}
      style={{
        maskImage: "url(/yusr-logo.png)",
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}
