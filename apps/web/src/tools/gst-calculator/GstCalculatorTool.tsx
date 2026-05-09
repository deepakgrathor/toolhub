"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gstCalculatorSchema, type GstCalculatorInput } from "./schema";
import { gstCalculatorConfig } from "./config";
import { Calculator, Copy } from "lucide-react";
import { toast } from "sonner";

interface GstResult {
  baseAmount: number;
  gstRate: number;
  totalGst: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  type: "exclusive" | "inclusive";
  transactionType: "intrastate" | "interstate";
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
        active
          ? "bg-accent text-white border-accent"
          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
      }`}
    >
      {label}
    </button>
  );
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${highlight ? "bg-accent/10" : "bg-surface"}`}>
      <span className={`text-sm ${highlight ? "font-semibold text-accent" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm font-medium ${highlight ? "text-accent" : "text-foreground"}`}>₹ {value}</span>
    </div>
  );
}

export default function GstCalculatorTool({ creditCost: _creditCost }: { creditCost?: number }) {
  const [result, setResult] = useState<GstResult | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GstCalculatorInput>({
    resolver: zodResolver(gstCalculatorSchema),
    defaultValues: { rate: "18", type: "exclusive", transactionType: "intrastate" },
  });

  const selectedRate = watch("rate");
  const selectedType = watch("type");
  const selectedTxType = watch("transactionType");

  const onSubmit = (data: GstCalculatorInput) => {
    const rate = parseFloat(data.rate) / 100;
    let baseAmount: number;
    let totalAmount: number;

    if (data.type === "exclusive") {
      baseAmount = data.amount;
      totalAmount = data.amount * (1 + rate);
    } else {
      totalAmount = data.amount;
      baseAmount = data.amount / (1 + rate);
    }

    const totalGst = totalAmount - baseAmount;
    const isIntrastate = data.transactionType === "intrastate";

    setResult({
      baseAmount,
      gstRate: parseFloat(data.rate),
      totalGst,
      cgst: isIntrastate ? totalGst / 2 : 0,
      sgst: isIntrastate ? totalGst / 2 : 0,
      igst: isIntrastate ? 0 : totalGst,
      totalAmount,
      type: data.type,
      transactionType: data.transactionType,
    });
  };

  const handleCopy = async () => {
    if (!result) return;
    const lines = [
      `GST Calculation (${result.gstRate}% — ${result.transactionType})`,
      `Base Amount: ₹${fmt(result.baseAmount)}`,
      result.transactionType === "intrastate"
        ? `CGST (${result.gstRate / 2}%): ₹${fmt(result.cgst)}\nSGST (${result.gstRate / 2}%): ₹${fmt(result.sgst)}`
        : `IGST (${result.gstRate}%): ₹${fmt(result.igst)}`,
      `Total GST: ₹${fmt(result.totalGst)}`,
      `Total Amount: ₹${fmt(result.totalAmount)}`,
    ].join("\n");
    await navigator.clipboard.writeText(lines);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <Calculator className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{gstCalculatorConfig.name}</h1>
              <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-500">
                FREE
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {gstCalculatorConfig.description}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Amount (₹) <span className="text-destructive">*</span>
            </label>
            <input
              {...register("amount")}
              type="number"
              step="0.01"
              placeholder="e.g. 10000"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">GST Rate</label>
            <div className="flex flex-wrap gap-2">
              {(["5", "12", "18", "28"] as const).map((r) => (
                <Pill
                  key={r}
                  label={`${r}%`}
                  active={selectedRate === r}
                  onClick={() => setValue("rate", r)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Calculation Type</label>
            <div className="flex flex-wrap gap-2">
              <Pill
                label="Exclusive (GST added on top)"
                active={selectedType === "exclusive"}
                onClick={() => setValue("type", "exclusive")}
              />
              <Pill
                label="Inclusive (GST within amount)"
                active={selectedType === "inclusive"}
                onClick={() => setValue("type", "inclusive")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Transaction Type</label>
            <div className="flex flex-wrap gap-2">
              <Pill
                label="Intrastate (CGST + SGST)"
                active={selectedTxType === "intrastate"}
                onClick={() => setValue("transactionType", "intrastate")}
              />
              <Pill
                label="Interstate (IGST)"
                active={selectedTxType === "interstate"}
                onClick={() => setValue("transactionType", "interstate")}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
          >
            <Calculator className="h-4 w-4" />
            Calculate GST
          </button>
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-[55%] p-4 md:p-6 flex flex-col">
        {!result ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <Calculator className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">GST breakdown will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Enter amount and select options</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                GST Breakdown — {result.gstRate}%
              </h2>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>

            <div className="space-y-2">
              <ResultRow
                label={result.type === "exclusive" ? "Original Amount (Base)" : "Total Amount (given)"}
                value={result.type === "exclusive" ? fmt(result.baseAmount) : fmt(result.totalAmount)}
              />

              {result.transactionType === "intrastate" ? (
                <>
                  <ResultRow label={`CGST @ ${result.gstRate / 2}%`} value={fmt(result.cgst)} />
                  <ResultRow label={`SGST @ ${result.gstRate / 2}%`} value={fmt(result.sgst)} />
                </>
              ) : (
                <ResultRow label={`IGST @ ${result.gstRate}%`} value={fmt(result.igst)} />
              )}

              <ResultRow label="Total GST" value={fmt(result.totalGst)} />

              <div className="pt-1">
                <ResultRow
                  label={result.type === "exclusive" ? "Total Payable" : "Base Amount (ex-GST)"}
                  value={result.type === "exclusive" ? fmt(result.totalAmount) : fmt(result.baseAmount)}
                  highlight
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {result.type === "exclusive"
                ? "Exclusive: GST calculated on top of the base amount"
                : "Inclusive: GST extracted from within the given amount"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
