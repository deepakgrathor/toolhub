"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useAuthStore } from "@/store/auth-store";
import { useCreditStore } from "@/store/credits-store";
import { signIn } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  Mail,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const signupStep1Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "One uppercase letter")
    .regex(/[a-z]/, "One lowercase letter")
    .regex(/[0-9]/, "One number")
    .regex(/[^A-Za-z0-9]/, "One special character"),
});

type LoginData = z.infer<typeof loginSchema>;
type SignupStep1Data = z.infer<typeof signupStep1Schema>;

// ── Password strength helper ─────────────────────────────────────────────────

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (!password) return null;

  const colors = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-yellow-400", "bg-[#10b981]"];
  const color = colors[Math.min(passed - 1, 4)];

  return (
    <div className="mt-2 space-y-1.5">
      {/* Strength bar */}
      <div className="flex gap-1">
        {PASSWORD_RULES.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-200",
              i < passed ? color : "bg-muted"
            )}
          />
        ))}
      </div>
      {/* Rule checklist */}
      <ul className="space-y-0.5">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.label} className="flex items-center gap-1.5 text-xs">
              {ok ? (
                <CheckCircle2 className="h-3 w-3 text-[#10b981] shrink-0" />
              ) : (
                <Circle className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
              <span className={ok ? "text-[#10b981]" : "text-muted-foreground"}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── OTP Input ────────────────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const arr = Array.from({ length: 6 }, (_, j) => value[j] ?? "");
    arr[i] = digit;
    onChange(arr.join("").trimEnd());
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      const arr = Array.from({ length: 6 }, (_, j) => value[j] ?? "");
      arr[i - 1] = "";
      onChange(arr.join("").trimEnd());
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
            "focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent",
            "transition-colors",
            digits[i] ? "border-[#7c3aed]" : "border-border"
          )}
        />
      ))}
    </div>
  );
}

// ── Input field helper ────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

const inputCls = (hasError: boolean) =>
  cn(
    "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent transition-colors",
    hasError ? "border-red-500" : "border-border"
  );

// ── Main Modal ────────────────────────────────────────────────────────────────

type SignupStep = "form" | "otp";

export function AuthModal() {
  const router = useRouter();
  const { isAuthModalOpen, authMode, closeAuthModal, setAuthMode } = useAuthStore();
  const syncCredits = useCreditStore((s) => s.syncFromServer);

  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Signup step state
  const [signupStep, setSignupStep] = useState<SignupStep>("form");
  const [signupData, setSignupData] = useState<SignupStep1Data | null>(null);
  const [otp, setOtp] = useState("");
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupStep1Data>({ resolver: zodResolver(signupStep1Schema) });

  const password = signupForm.watch("password") ?? "";

  // Reset on modal close / mode switch
  useEffect(() => {
    if (!isAuthModalOpen) {
      setServerError("");
      setSignupStep("form");
      setSignupData(null);
      setOtp("");
      setShowPassword(false);
      loginForm.reset();
      signupForm.reset();
    }
  }, [isAuthModalOpen]); // eslint-disable-line

  const switchMode = (mode: "login" | "signup") => {
    setServerError("");
    setSignupStep("form");
    setSignupData(null);
    setOtp("");
    setAuthMode(mode);
  };

  // Countdown for OTP resend
  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const t = setTimeout(() => setOtpResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpResendCooldown]);

  // ── Login ──────────────────────────────────────────────────────────────────

  const handleLogin = async (data: LoginData) => {
    setLoading(true);
    setServerError("");
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      const msg = "Invalid email or password";
      setServerError(msg);
      toast.error(msg);
    } else {
      closeAuthModal();
      syncCredits();
      toast.success(`Welcome back!`);
      const pendingPlan = localStorage.getItem("pending_plan");
      const pendingPackId = localStorage.getItem("pending_pack_id");
      if (pendingPlan) {
        const pendingCycle = localStorage.getItem("pending_plan_cycle") ?? "monthly";
        localStorage.removeItem("pending_plan");
        localStorage.removeItem("pending_plan_cycle");
        router.push(`/checkout?type=plan&slug=${pendingPlan}&cycle=${pendingCycle}`);
      } else if (pendingPackId) {
        localStorage.removeItem("pending_pack_id");
        router.push(`/checkout?type=pack&id=${pendingPackId}`);
      } else {
        router.push("/dashboard");
      }
    }
  };

  // ── Signup Step 1: Send OTP ────────────────────────────────────────────────

  const handleSendOtp = async (data: SignupStep1Data) => {
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Failed to send OTP");
        setLoading(false);
        return;
      }
      setSignupData(data);
      setSignupStep("otp");
      setOtpResendCooldown(60);
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  // ── Signup Step 2: Verify OTP + Create Account ────────────────────────────

  const handleVerifyOtp = async () => {
    if (!signupData || otp.length !== 6) {
      setServerError("Enter the 6-digit OTP sent to your email");
      return;
    }
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...signupData, otp }),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Signup failed");
        setLoading(false);
        return;
      }
      // Auto-login after signup
      const result = await signIn("credentials", {
        email: signupData.email,
        password: signupData.password,
        redirect: false,
      });
      setLoading(false);
      if (result?.error) {
        setServerError("Account created. Please sign in.");
        switchMode("login");
      } else {
        closeAuthModal();
        syncCredits();
        toast.success("Account created! 10 free credits added.");
        const pendingPlan = localStorage.getItem("pending_plan");
        const pendingPackId = localStorage.getItem("pending_pack_id");
        if (pendingPlan) {
          const pendingCycle = localStorage.getItem("pending_plan_cycle") ?? "monthly";
          localStorage.removeItem("pending_plan");
          localStorage.removeItem("pending_plan_cycle");
          router.push(`/checkout?type=plan&slug=${pendingPlan}&cycle=${pendingCycle}`);
        } else if (pendingPackId) {
          localStorage.removeItem("pending_pack_id");
          router.push(`/checkout?type=pack&id=${pendingPackId}`);
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────

  const handleResendOtp = async () => {
    if (!signupData || otpResendCooldown > 0) return;
    setLoading(true);
    setServerError("");
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: signupData.name, email: signupData.email }),
      });
      setOtpResendCooldown(60);
      setOtp("");
    } catch {
      setServerError("Failed to resend OTP");
    }
    setLoading(false);
  };

  // ── Google ─────────────────────────────────────────────────────────────────

  const handleGoogle = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog.Root open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-border bg-card p-6 shadow-2xl focus:outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none transition-opacity">
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          {/* Logo + heading */}
          <div className="mb-5 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#7c3aed]/20 mb-3">
              <span className="text-[#7c3aed] font-bold text-lg">T</span>
            </div>
            <Dialog.Title className="text-xl font-semibold text-foreground">
              {authMode === "login"
                ? "Welcome back"
                : signupStep === "otp"
                ? "Verify your email"
                : "Create account"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              {authMode === "login"
                ? "Sign in to your SetuLix account"
                : signupStep === "otp"
                ? `OTP sent to ${signupData?.email}`
                : "Get 10 free credits on signup"}
            </Dialog.Description>
          </div>

          {/* Mode tabs — hidden during OTP step */}
          {signupStep === "form" && (
            <div className="mb-5 flex rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
                  authMode === "login"
                    ? "bg-[#7c3aed] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
                  authMode === "signup"
                    ? "bg-[#7c3aed] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Server error */}
          {serverError && (
            <p className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
              {serverError}
            </p>
          )}

          {/* ── LOGIN FORM ── */}
          {authMode === "login" && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <Field label="Email" error={loginForm.formState.errors.email?.message}>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...loginForm.register("email")}
                  className={inputCls(!!loginForm.formState.errors.email)}
                />
              </Field>

              <Field label="Password" error={loginForm.formState.errors.password?.message}>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...loginForm.register("password")}
                    className={cn(inputCls(!!loginForm.formState.errors.password), "pr-10")}
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
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7c3aed] py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign In
              </button>
            </form>
          )}

          {/* ── SIGNUP STEP 1: Form ── */}
          {authMode === "signup" && signupStep === "form" && (
            <form onSubmit={signupForm.handleSubmit(handleSendOtp)} className="space-y-4">
              <Field label="Full Name" error={signupForm.formState.errors.name?.message}>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Deepak Rathor"
                  {...signupForm.register("name")}
                  className={inputCls(!!signupForm.formState.errors.name)}
                />
              </Field>

              <Field label="Email" error={signupForm.formState.errors.email?.message}>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...signupForm.register("email")}
                  className={inputCls(!!signupForm.formState.errors.email)}
                />
              </Field>

              <Field label="Password" error={signupForm.formState.errors.password?.message}>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    {...signupForm.register("password")}
                    className={cn(inputCls(!!signupForm.formState.errors.password), "pr-10")}
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
                <PasswordStrength password={password} />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7c3aed] py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Send Verification Code
              </button>
            </form>
          )}

          {/* ── SIGNUP STEP 2: OTP ── */}
          {authMode === "signup" && signupStep === "otp" && (
            <div className="space-y-5">
              <OtpInput value={otp} onChange={setOtp} />

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7c3aed] py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify &amp; Create Account
              </button>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => { setSignupStep("form"); setOtp(""); setServerError(""); }}
                  className="hover:text-foreground transition-colors"
                >
                  ← Change details
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={otpResendCooldown > 0 || loading}
                  className="flex items-center gap-1 hover:text-foreground disabled:opacity-40 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  {otpResendCooldown > 0 ? `Resend in ${otpResendCooldown}s` : "Resend OTP"}
                </button>
              </div>
            </div>
          )}

          {/* Google divider — only on step 1 */}
          {signupStep === "form" && (
            <>
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors"
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
