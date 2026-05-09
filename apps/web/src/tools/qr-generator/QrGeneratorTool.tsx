"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { qrGeneratorSchema, type QrGeneratorInput } from "./schema";
import { qrGeneratorConfig } from "./config";
import { QrCode, Download, Copy } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";

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

export default function QrGeneratorTool({ creditCost: _creditCost }: { creditCost?: number }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QrGeneratorInput>({
    resolver: zodResolver(qrGeneratorSchema),
    defaultValues: { size: "256", errorCorrection: "M" },
  });

  const selectedSize = watch("size");
  const selectedEC = watch("errorCorrection");

  const onSubmit = async (data: QrGeneratorInput) => {
    setIsGenerating(true);
    try {
      const url = await QRCode.toDataURL(data.text, {
        width: parseInt(data.size, 10),
        errorCorrectionLevel: data.errorCorrection,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrDataUrl(url);
    } catch {
      toast.error("Failed to generate QR code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qrcode-${Date.now()}.png`;
    a.click();
    toast.success("QR code downloaded");
  };

  const handleCopy = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy not supported in this browser");
    }
  };

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <QrCode className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{qrGeneratorConfig.name}</h1>
              <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-500">
                FREE
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {qrGeneratorConfig.description}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              URL or Text <span className="text-destructive">*</span>
            </label>
            <textarea
              {...register("text")}
              rows={3}
              placeholder="https://toolspire.io or any text"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none"
            />
            {errors.text && (
              <p className="text-xs text-destructive">{errors.text.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Size</label>
            <div className="flex flex-wrap gap-2">
              {(["128", "256", "512"] as const).map((s) => (
                <Pill
                  key={s}
                  label={`${s}×${s}`}
                  active={selectedSize === s}
                  onClick={() => setValue("size", s)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Error Correction
            </label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "L", label: "Low (L)" },
                { value: "M", label: "Medium (M)" },
                { value: "Q", label: "High (Q)" },
                { value: "H", label: "Max (H)" },
              ] as const).map(({ value, label }) => (
                <Pill
                  key={value}
                  label={label}
                  active={selectedEC === value}
                  onClick={() => setValue("errorCorrection", value)}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Higher error correction = larger QR code</p>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <QrCode className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate QR Code"}
          </button>
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-[55%] p-4 md:p-6 flex flex-col items-center justify-center">
        {!qrDataUrl ? (
          <div className="h-full min-h-[300px] w-full flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <QrCode className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Your QR code will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Enter your URL or text and click Generate</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Generated QR code" className="block" />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface transition-colors"
              >
                <Copy className="h-4 w-4" />
                Copy Image
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download PNG
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Size: {selectedSize}×{selectedSize}px · Error correction: {selectedEC}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
