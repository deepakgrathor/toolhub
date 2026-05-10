"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ArrowLeft, RefreshCw, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

// ── OTP Input — 6 individual boxes ───────────────────────────────────────────

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, idx) => (idx === i ? digit : d)).join("");
    onChange(next.trimEnd());
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      const next = digits.map((d, idx) => (idx === i - 1 ? "" : d)).join("");
      onChange(next.trimEnd());
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cn(
            "h-12 w-10 rounded-lg border text-center text-lg font-bold bg-[#111111] text-white",
            "focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent transition-colors",
            digits[i] ? "border-[#7c3aed]" : "border-white/10"
          )}
        />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Step = "mobile" | "otp";

export default function AdminLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("mobile");
  const [mobile10, setMobile10] = useState(""); // 10 digits user enters
  const [maskedMobile, setMaskedMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const fullMobile = `91${mobile10}`; // prepend India country code

  async function sendOtp(mobileNum: string): Promise<string | null> {
    const res = await fetch("/api/admin-auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: mobileNum }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to send OTP");
      return null;
    }
    return json.maskedMobile as string;
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (mobile10.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    setError("");
    const masked = await sendOtp(fullMobile);
    if (masked) {
      setMaskedMobile(masked);
      setStep("otp");
      setResendCooldown(60);
    }
    setLoading(false);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError("");
    const masked = await sendOtp(fullMobile);
    if (masked) {
      setMaskedMobile(masked);
      setOtp("");
      setResendCooldown(60);
    }
    setLoading(false);
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP sent to your mobile");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin-auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: fullMobile, otp }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Verification failed");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="w-full max-w-sm">
      {/* Card */}
      <div className="rounded-2xl border border-white/10 bg-[#111111] p-8 shadow-2xl">

        {/* Logo + heading */}
        <div className="flex flex-col items-center mb-7">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7c3aed]/20 mb-4 ring-1 ring-[#7c3aed]/30">
            <ShieldCheck className="h-7 w-7 text-[#7c3aed]" />
          </div>
          <h1 className="text-xl font-bold text-white">
            <span>Setu</span><span className="text-[#7c3aed]">Lix</span>{" "}
            <span className="text-white/40 font-normal text-sm">Admin</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {step === "mobile" ? "Admin Access" : "Verify Identity"}
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ── STEP 1: Mobile Input ── */}
        {step === "mobile" && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                Mobile Number
              </label>
              <div className="flex items-center rounded-lg border border-white/10 bg-[#0d0d0d] focus-within:ring-2 focus-within:ring-[#7c3aed] focus-within:border-transparent transition-all overflow-hidden">
                <div className="flex items-center gap-1.5 pl-3 pr-2 py-2.5 border-r border-white/10 shrink-0">
                  <Smartphone className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-sm text-white/50 font-medium">+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="98XXXXXXXX"
                  value={mobile10}
                  onChange={(e) => setMobile10(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  autoFocus
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || mobile10.length !== 10}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7c3aed] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : null
              }
              {loading ? "Sending OTP..." : "Send OTP →"}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP Verification ── */}
        {step === "otp" && (
          <div className="space-y-5">
            <div className="text-center">
              <p className="text-sm text-white/50">
                OTP sent to <span className="text-white font-medium">+91 {maskedMobile.slice(2)}</span>
              </p>
              <p className="text-xs text-white/30 mt-0.5">Valid for 10 minutes</p>
            </div>

            <OtpInput value={otp} onChange={setOtp} />

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 6}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7c3aed] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Verifying..." : "Verify & Login"}
            </button>

            <div className="flex items-center justify-between text-xs text-white/30">
              <button
                type="button"
                onClick={() => { setStep("mobile"); setOtp(""); setError(""); }}
                className="flex items-center gap-1 hover:text-white/60 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Change Number
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className="flex items-center gap-1 hover:text-white/60 disabled:opacity-40 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-white/20">
        SetuLix Admin · by <span className="text-[#7c3aed]/60">SetuLabsAI</span>
      </p>
    </div>
  );
}
