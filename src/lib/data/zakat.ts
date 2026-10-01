// Pure zakat rules, ported 1:1 from the Flutter zakat cubits
// (lib/features/zakat/logic/*.dart) so web and app give the same answers.

export const ZAKAT_RATE = 0.025;
/** Money nisab: the value of 85 g of 24k gold (ZakatMoneyCubit). */
export const MONEY_NISAB_GOLD_GRAMS = 85;
/** Nisab in grams per metal (ZakatGoldCubit.getNisab + notesGold). */
export const METAL_NISAB = { gold18: 113, gold21: 97, gold24: 85, silver: 595 } as const;
export type Metal = keyof typeof METAL_NISAB;
/** Crops nisab: 5 awsuq ≈ 653 kg (ZakatCropsCubit). */
export const CROPS_NISAB_KG = 653;
export const CROPS_RATIO = { rain: 0.1, artificial: 0.05, mixed: 0.075 } as const;
export type Irrigation = keyof typeof CROPS_RATIO;
export const LIVESTOCK_NISAB = { sheep: 40, cows: 30, camels: 5 } as const;
export type Animal = keyof typeof LIVESTOCK_NISAB;

/** ZakatInputParser: Arabic/Persian digits and Arabic decimal separators. */
export function parseNonNegative(input: string): number | null {
  const s = input
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0))
    .replace(/[٫،,]/g, ".");
  if (!s || !/^\d*\.?\d+$|^\d+\.$/.test(s)) return null;
  const v = Number(s);
  return Number.isFinite(v) && v >= 0 ? v : null;
}

export const moneyZakat = (amount: number, goldPrice: number) => {
  const nisab = MONEY_NISAB_GOLD_GRAMS * goldPrice;
  return { nisab, zakat: amount < nisab ? 0 : amount * ZAKAT_RATE };
};

export const metalZakat = (metal: Metal, grams: number, price: number) => {
  const eligible = grams >= METAL_NISAB[metal];
  return { eligible, grams: eligible ? grams * ZAKAT_RATE : 0, value: eligible ? grams * ZAKAT_RATE * price : 0 };
};

export const cropsZakat = (kg: number, irrigation: Irrigation) =>
  kg < CROPS_NISAB_KG ? { eligible: false, kg: 0 } : { eligible: true, kg: kg * CROPS_RATIO[irrigation] };

export type LivestockUnit = "sheep" | "tabee" | "musinnah" | "bintMakhad" | "bintLabun" | "hiqqah" | "jadha";
export type LivestockPart = { unit: LivestockUnit; count: number };
export type LivestockResult =
  | { eligible: false; reason: "conditions" | `${Animal}Below` }
  | { eligible: true; options: LivestockPart[][]; explain: string };

export function livestockZakat(
  animal: Animal,
  heads: number,
  conditions: { saimah: boolean; fullYear: boolean; notWorking: boolean },
): LivestockResult {
  if (!conditions.saimah || !conditions.fullYear || !conditions.notWorking)
    return { eligible: false, reason: "conditions" };
  if (heads < LIVESTOCK_NISAB[animal]) return { eligible: false, reason: `${animal}Below` };
  const one = (unit: LivestockUnit, count: number, explain: string): LivestockResult => ({
    eligible: true,
    options: [[{ unit, count }]],
    explain,
  });

  if (animal === "sheep") {
    if (heads <= 120) return one("sheep", 1, "sheep1");
    if (heads <= 200) return one("sheep", 2, "sheep2");
    if (heads <= 399) return one("sheep", 3, "sheep3");
    return one("sheep", Math.floor(heads / 100), "sheep100");
  }

  if (animal === "cows") {
    if (heads <= 39) return one("tabee", 1, "cows30");
    if (heads <= 59) return one("musinnah", 1, "cows40");
    let best = { sum: 0, x: 0, y: 0 };
    for (let x = 0; x * 30 <= heads; x++) {
      const y = Math.floor((heads - x * 30) / 40);
      const sum = x * 30 + y * 40;
      if (sum > best.sum) best = { sum, x, y };
    }
    const parts: LivestockPart[] = [];
    if (best.x) parts.push({ unit: "tabee", count: best.x });
    if (best.y) parts.push({ unit: "musinnah", count: best.y });
    return { eligible: true, options: [parts], explain: "cows60" };
  }

  if (heads <= 24) return one("sheep", Math.floor(heads / 5), "camels5");
  if (heads <= 35) return one("bintMakhad", 1, "camels25");
  if (heads <= 45) return one("bintLabun", 1, "camels36");
  if (heads <= 60) return one("hiqqah", 1, "camels46");
  if (heads <= 75) return one("jadha", 1, "camels61");
  if (heads <= 90) return one("bintLabun", 2, "camels76");
  if (heads <= 120) return one("hiqqah", 2, "camels91");
  let bestSum = 0;
  let options: LivestockPart[][] = [];
  for (let hiqqah = 0; hiqqah * 50 <= heads; hiqqah++) {
    const bintLabun = Math.floor((heads - hiqqah * 50) / 40);
    const sum = hiqqah * 50 + bintLabun * 40;
    if (sum > bestSum) {
      bestSum = sum;
      options = [];
    }
    if (sum === bestSum) {
      const parts: LivestockPart[] = [];
      if (bintLabun) parts.push({ unit: "bintLabun", count: bintLabun });
      if (hiqqah) parts.push({ unit: "hiqqah", count: hiqqah });
      options.push(parts);
    }
  }
  return { eligible: true, options, explain: options.length > 1 ? "camels121Multi" : "camels121" };
}
