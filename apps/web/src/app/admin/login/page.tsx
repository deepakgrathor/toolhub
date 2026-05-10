"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "credentials" | "otp";

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
            "h-12 w-10 rounded-lg border text-center text-lg font-bold bg-background text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent transition-colors",
            digits[i] ? "border-[#7c3aed]" : "border-border"
          )}
        />
      ))}
    </div>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputCls = cn(
    "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent transition-colors border-border"
  );

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Authentication failed");
      } else {
        setStep("otp");
        startResendCountdown();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  function startResendCountdown() {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError("");
    try {
      await fetch("/api/admin/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      setOtp("");
      startResendCountdown();
    } catch {
      setError("Failed to resend OTP");
    }
    setLoading(false);
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP sent to your email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Invalid OTP");
        setLoading(false);
        return;
      }

      // Use the adminToken to sign in via NextAuth
      const result = await signIn("credentials", {
        adminToken: json.adminToken,
        redirect: false,
      });

      if (result?.error) {
        setError("Login failed. Please try again.");
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
      <div className="rounded-xl border border-border bg-card p-8 shadow-xl">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7c3aed]/15 mb-3">
            <ShieldCheck className="h-6 w-6 text-[#7c3aed]" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            <span>Setu</span><span className="text-[#7c3aed]">Lix</span>{" "}
            <span className="text-muted-foreground font-normal text-sm">Admin</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "credentials"
              ? "Sign in to the admin panel"
              : `OTP sent to ${email}`}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Email + Password */}
        {step === "credentials" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Admin Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="admin@setulix.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={cn(inputCls, "pr-10")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7c3aed] py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === "otp" && (
          <div className="space-y-5">
            <OtpInput value={otp} onChange={setOtp} />

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 6}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7c3aed] py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify &amp; Sign In
            </button>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => { setStep("credentials"); setOtp(""); setError(""); }}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                className="flex items-center gap-1 hover:text-foreground disabled:opacity-40 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        SetuLix Admin Panel · <span className="text-[#7c3aed]">SetuLabsAI</span>
      </p>
    </div>
  );
}
