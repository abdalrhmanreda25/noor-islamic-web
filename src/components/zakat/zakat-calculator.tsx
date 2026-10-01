"use client";

import { Banknote, Calculator, CheckCircle2, Info, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  cropsZakat,
  CROPS_NISAB_KG,
  LIVESTOCK_NISAB,
  livestockZakat,
  METAL_NISAB,
  metalZakat,
  moneyZakat,
  parseNonNegative,
  type Animal,
  type Irrigation,
  type LivestockResult,
  type Metal,
} from "@/lib/data/zakat";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "money", icon: null },
  { id: "gold", icon: "/icons/zakat/gold.svg" },
  { id: "livestock", icon: "/icons/zakat/livestock.svg" },
  { id: "crops", icon: "/icons/zakat/crops.svg" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const useNum = () => {
  const locale = useLocale();
  return (n: number, digits = 2) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: digits }).format(n);
};

export function ZakatCalculator() {
  const t = useTranslations("zakat");
  const [tab, setTab] = useState<Tab>("money");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TABS.map(({ id, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 text-center transition hover:border-brand/50",
              tab === id && "border-brand bg-secondary ring-2 ring-brand/30",
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-secondary">
              {icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={icon} alt="" className="size-9 object-contain" />
              ) : (
                <Banknote className="size-7 text-brand" />
              )}
            </span>
            <span className="font-bold">{t(`tabs.${id}`)}</span>
            <span className="text-xs text-muted-foreground">{t(`tabDesc.${id}`)}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-2xl border bg-card p-5">
          {tab === "money" && <MoneyForm />}
          {tab === "gold" && <MetalForm />}
          {tab === "livestock" && <LivestockForm />}
          {tab === "crops" && <CropsForm />}
        </div>
        <aside className="space-y-3 rounded-2xl border bg-card p-5">
          <p className="flex items-center gap-2 font-bold">
            <Info className="size-5 text-brand" />
            {tab === "livestock" ? t("livestock.notesTitle") : tab === "crops" ? t("crops.notesTitle") : t("notes")}
          </p>
          <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{t(`${tab}.notes`)}</p>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  error,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | false;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <Input inputMode="decimal" placeholder={hint} value={value} onChange={(e) => onChange(e.target.value)} />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

function Choice<T extends string>({
  options,
  value,
  onChange,
  cols = "sm:grid-cols-2",
}: {
  options: { id: T; label: ReactNode; desc?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  cols?: string;
}) {
  return (
    <div className={cn("grid gap-2", cols)}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={cn(
            "rounded-xl border px-3 py-2.5 text-start text-sm transition hover:border-brand/50",
            value === o.id && "border-brand bg-secondary font-bold",
          )}
        >
          {o.label}
          {o.desc && <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{o.desc}</span>}
        </button>
      ))}
    </div>
  );
}

function Result({ ok, title, children }: { ok: boolean; title: ReactNode; children?: ReactNode }) {
  const t = useTranslations("zakat");
  return (
    <div className={cn("rounded-2xl p-5", ok ? "hero-gradient text-white" : "border bg-muted")}>
      <p className={cn("flex items-center gap-2 text-sm", ok ? "text-white/70" : "text-muted-foreground")}>
        {ok ? <CheckCircle2 className="size-4 text-gold" /> : <XCircle className="size-4" />}
        {ok ? t("due") : t("notDue")}
      </p>
      <p className={cn("mt-1 whitespace-pre-line text-2xl font-bold", ok && "text-gold")}>{title}</p>
      {children && <div className={cn("mt-3 text-sm leading-7", ok ? "text-white/85" : "text-muted-foreground")}>{children}</div>}
    </div>
  );
}

function CalcButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("zakat");
  return (
    <Button onClick={onClick} className="w-full" size="lg">
      <Calculator />
      {t("calculate")}
    </Button>
  );
}

function MoneyForm() {
  const t = useTranslations("zakat");
  const num = useNum();
  const [type, setType] = useState<"savings" | "bank">("savings");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [tried, setTried] = useState(false);
  const [res, setRes] = useState<ReturnType<typeof moneyZakat> | null>(null);
  const a = parseNonNegative(amount);
  const p = parseNonNegative(price);
  const reset = () => setRes(null);

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">{t("money.type")}</p>
      <Choice
        value={type}
        onChange={(v) => (setType(v), reset())}
        options={[
          { id: "savings", label: t("money.savings") },
          { id: "bank", label: t("money.bank") },
        ]}
      />
      <Field label={t("money.amount")} hint={t("money.amountHint")} value={amount} onChange={(v) => (setAmount(v), reset())} error={tried && a == null && t("invalid")} />
      <Field label={t("money.goldPrice")} hint={t("money.goldPriceHint")} value={price} onChange={(v) => (setPrice(v), reset())} error={tried && !p && t("invalid")} />
      <p className="rounded-xl bg-secondary p-3 text-xs leading-6 text-muted-foreground">{t("money.nisabInfo")}</p>
      <CalcButton onClick={() => (setTried(true), setRes(a != null && p ? moneyZakat(a, p) : null))} />
      {res && (
        <Result ok={res.zakat > 0} title={res.zakat > 0 ? num(res.zakat) : t("belowNisab")}>
          {t("money.nisabValue", { value: num(res.nisab) })}
        </Result>
      )}
    </div>
  );
}

function MetalForm() {
  const t = useTranslations("zakat");
  const num = useNum();
  const [metal, setMetal] = useState<Metal>("gold21");
  const [grams, setGrams] = useState("");
  const [price, setPrice] = useState("");
  const [tried, setTried] = useState(false);
  const [res, setRes] = useState<ReturnType<typeof metalZakat> | null>(null);
  const g = parseNonNegative(grams);
  const p = parseNonNegative(price);
  const reset = () => setRes(null);

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">{t("gold.type")}</p>
      <Choice
        cols="grid-cols-2 sm:grid-cols-4"
        value={metal}
        onChange={(v) => (setMetal(v), reset())}
        options={(Object.keys(METAL_NISAB) as Metal[]).map((m) => ({
          id: m,
          label: t(`gold.${m}`),
          desc: t("gold.nisab", { grams: num(METAL_NISAB[m]) }),
        }))}
      />
      <Field label={t("gold.grams")} hint={t("gold.gramsHint")} value={grams} onChange={(v) => (setGrams(v), reset())} error={tried && g == null && t("invalid")} />
      <Field label={t("gold.price")} hint={t("gold.priceHint")} value={price} onChange={(v) => (setPrice(v), reset())} error={tried && p == null && t("invalid")} />
      <CalcButton onClick={() => (setTried(true), setRes(g != null && p != null ? metalZakat(metal, g, p) : null))} />
      {res && (
        <Result ok={res.eligible} title={res.eligible ? num(res.value) : t("belowNisab")}>
          {res.eligible ? t("gold.gramsDue", { grams: num(res.grams, 3) }) : t("gold.nisab", { grams: num(METAL_NISAB[metal]) })}
        </Result>
      )}
    </div>
  );
}

function LivestockForm() {
  const t = useTranslations("zakat");
  const num = useNum();
  const [animal, setAnimal] = useState<Animal>("sheep");
  const [heads, setHeads] = useState("");
  const [cond, setCond] = useState({ saimah: true, fullYear: true, notWorking: true });
  const [tried, setTried] = useState(false);
  const [res, setRes] = useState<LivestockResult | null>(null);
  const h = parseNonNegative(heads);
  const validHeads = h != null && Number.isInteger(h) ? h : null;
  const reset = () => setRes(null);

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">{t("livestock.choose")}</p>
      <Choice
        cols="sm:grid-cols-3"
        value={animal}
        onChange={(v) => (setAnimal(v), reset())}
        options={(Object.keys(LIVESTOCK_NISAB) as Animal[]).map((a) => ({
          id: a,
          label: `${{ sheep: "🐑", cows: "🐄", camels: "🐫" }[a]} ${t(`livestock.${a}`)}`,
          desc: t("livestock.nisab", { count: num(LIVESTOCK_NISAB[a]) }),
        }))}
      />
      <Field label={t("livestock.heads")} hint={t("livestock.headsHint")} value={heads} onChange={(v) => (setHeads(v), reset())} error={tried && validHeads == null && t("invalid")} />
      <p className="text-sm font-medium">{t("livestock.conditions")}</p>
      <div className="space-y-2">
        {(["saimah", "fullYear", "notWorking"] as const).map((k) => (
          <label key={k} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 hover:border-brand/50">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-[var(--color-primary)]"
              checked={cond[k]}
              onChange={(e) => (setCond({ ...cond, [k]: e.target.checked }), reset())}
            />
            <span>
              <span className="block text-sm font-medium">{t(`livestock.${k}`)}</span>
              <span className="block text-xs text-muted-foreground">{t(`livestock.${k}Desc`)}</span>
            </span>
          </label>
        ))}
      </div>
      <CalcButton onClick={() => (setTried(true), setRes(validHeads != null ? livestockZakat(animal, validHeads, cond) : null))} />
      {res &&
        (res.eligible ? (
          <Result
            ok
            title={res.options
              .map((parts) => parts.map((p) => t(`livestock.units.${p.unit}`, { count: p.count, n: num(p.count, 0) })).join(t("livestock.and")))
              .join(`\n${t("livestock.or")}\n`)}
          >
            {t(`livestock.explain.${res.explain}`)}
          </Result>
        ) : (
          <Result ok={false} title={res.reason === "conditions" ? t("notDue") : t("livestock.notEligible")}>
            {t(`livestock.explain.${res.reason}`)}
          </Result>
        ))}
    </div>
  );
}

function CropsForm() {
  const t = useTranslations("zakat");
  const num = useNum();
  const [weight, setWeight] = useState("");
  const [irrigation, setIrrigation] = useState<Irrigation>("rain");
  const [tried, setTried] = useState(false);
  const [res, setRes] = useState<ReturnType<typeof cropsZakat> | null>(null);
  const w = parseNonNegative(weight);
  const reset = () => setRes(null);

  return (
    <div className="space-y-4">
      <Field label={t("crops.weight")} hint={t("crops.weightHint")} value={weight} onChange={(v) => (setWeight(v), reset())} error={tried && w == null && t("invalid")} />
      <p className="text-sm font-medium">{t("crops.irrigation")}</p>
      <Choice
        cols=""
        value={irrigation}
        onChange={(v) => (setIrrigation(v), reset())}
        options={(["rain", "artificial", "mixed"] as const).map((i) => ({ id: i, label: t(`crops.${i}`), desc: t(`crops.${i}Desc`) }))}
      />
      <CalcButton onClick={() => (setTried(true), setRes(w != null ? cropsZakat(w, irrigation) : null))} />
      {res &&
        (res.eligible ? (
          <Result ok title={t("crops.dueKg", { kg: num(res.kg) })}>
            {t("crops.explain", {
              irrigation: t(`crops.irrigationName.${irrigation}`),
              ratio: t(`crops.ratio.${irrigation}`),
              kg: num(res.kg),
            })}
          </Result>
        ) : (
          <Result ok={false} title={t("notDue")}>
            {t("crops.below", { nisab: num(CROPS_NISAB_KG) })}
          </Result>
        ))}
    </div>
  );
}
