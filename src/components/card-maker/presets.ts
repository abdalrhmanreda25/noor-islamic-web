// Card styles and options, mirroring the app's card maker.

export type CardStyle = { id: string; bg: string[]; text: string; accent: string };

export const STYLES: CardStyle[] = [
  { id: "dark_elegant", bg: ["#0B1F1A", "#06120F"], text: "#F5EFE0", accent: "#D7AD58" },
  { id: "light_cream", bg: ["#F8F3E7", "#EFE6CF"], text: "#11221D", accent: "#0F5F50" },
  { id: "green_gradient", bg: ["#0F5F50", "#032D26"], text: "#FFFFFF", accent: "#D7AD58" },
  { id: "midnight_blue", bg: ["#16284A", "#070F20"], text: "#EFF3FF", accent: "#D7AD58" },
  { id: "desert_sand", bg: ["#EBD8B4", "#D3B384"], text: "#3B2A14", accent: "#7A4E1D" },
  { id: "royal_purple", bg: ["#2E1A47", "#120A1E"], text: "#F6EEFF", accent: "#E2B96F" },
  { id: "pure_white", bg: ["#FFFFFF"], text: "#1B2D27", accent: "#0F5F50" },
];

export const ASPECTS = { portrait: 4 / 5, square: 1, story: 9 / 16 } as const;
export type Aspect = keyof typeof ASPECTS;

export const LAYOUTS = ["arch", "frame", "minimal"] as const;
export type Layout = (typeof LAYOUTS)[number];

export const FONTS = ["naskh", "modern"] as const;
export type CardFont = (typeof FONTS)[number];

export type ContentType = "quran" | "hadith" | "custom";

export type Design = { style: string; aspect: Aspect; layout: Layout; font: CardFont; pattern: boolean; scale: number };

export const DEFAULT_DESIGN: Design = {
  style: STYLES[0].id,
  aspect: "portrait",
  layout: "arch",
  font: "naskh",
  pattern: true,
  scale: 1,
};

/** Whether the background is light (luminance of the first stop). */
export function isLight(style: CardStyle) {
  const n = parseInt(style.bg[0].slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5;
}

export const arabicDigits = (n: number) => n.toLocaleString("ar-EG", { useGrouping: false });
