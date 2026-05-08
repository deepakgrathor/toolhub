"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useAuthStore } from "@/store/auth-store";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginData = z.infer<typeof loginSchema>;
type SignupData = z.infer<typeof signupSchema>;

export function AuthModal() {
  const { isAuthModalOpen, authMode, closeAuthModal, setAuthMode } =
    useAuthStore();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
  });

  const clearErrors = () => {
    setServerError("");
    loginForm.clearErrors();
    signupForm.clearErrors();
  };

  const switchMode = (mode: "login" | "signup") => {
    clearErrors();
    setAuthMode(mode);
  };

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
      setServerError("Invalid email or password");
    } else {
      closeAuthModal();
    }
  };

  const handleSignup = async (data: SignupData) => {
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error ?? "Signup failed");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      setLoading(false);
      if (result?.error) {
        setServerError("Account created. Please sign in.");
        switchMode("login");
      } else {
        closeAuthModal();
      }
    } catch {
      setLoading(false);
      setServerError("Something went wrong. Please try again.");
    }
  };

  const handleGoogle = () => {
    signIn("google", { callbackUrl: window.location.href });
  };

  return (
    <Dialog.Root
      open={isAuthModalOpen}
      onOpenChange={(open) => !open && closeAuthModal()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-border bg-[#111111] p-6 shadow-2xl",
            "dark:bg-[#111111] dark:border-white/10",
            "light:bg-white light:border-black/10",
            "focus:outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-48",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-48"
          )}
        >
          {/* Close button */}
          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] transition-opacity">
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          {/* Logo + heading */}
          <div className="mb-6 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#7c3aed]/20 mb-3">
              <span className="text-[#7c3aed] font-bold text-lg">T</span>
            </div>
            <Dialog.Title className="text-xl font-semibold text-foreground">
              {authMode === "login" ? "Welcome back" : "Create account"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              {authMode === "login"
                ? "Sign in to your Toolspire account"
                : "Get 10 free credits on signup"}
            </Dialog.Description>
          </div>

          {/* Tab toggle */}
          <div className="mb-5 flex rounded-lg bg-background p-1">
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

          {/* Server error */}
          {serverError && (
            <p className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
              {serverError}
            </p>
          )}

          {/* Login form */}
          {authMode === "login" && (
            <form
              onSubmit={loginForm.handleSubmit(handleLogin)}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...loginForm.register("email")}
                  className={cn(
                    "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent",
                    "transition-colors",
                    loginForm.formState.errors.email
                      ? "border-red-500"
                      : "border-border"
                  )}
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-400">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...loginForm.register("password")}
                  className={cn(
                    "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent",
                    "transition-colors",
                    loginForm.formState.errors.password
                      ? "border-red-500"
                      : "border-border"
                  )}
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-400">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7c3aed] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign In
              </button>
            </form>
          )}

          {/* Signup form */}
          {authMode === "signup" && (
            <form
              onSubmit={signupForm.handleSubmit(handleSignup)}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Name
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  {...signupForm.register("name")}
                  className={cn(
                    "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent",
                    "transition-colors",
                    signupForm.formState.errors.name
                      ? "border-red-500"
                      : "border-border"
                  )}
                />
                {signupForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-400">
                    {signupForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...signupForm.register("email")}
                  className={cn(
                    "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent",
                    "transition-colors",
                    signupForm.formState.errors.email
                      ? "border-red-500"
                      : "border-border"
                  )}
                />
                {signupForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-400">
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  {...signupForm.register("password")}
                  className={cn(
                    "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent",
                    "transition-colors",
                    signupForm.formState.errors.password
                      ? "border-red-500"
                      : "border-border"
                  )}
                />
                {signupForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-400">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7c3aed] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Account
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg border border-border",
              "bg-background py-2.5 text-sm font-medium text-foreground",
              "hover:bg-white/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            )}
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
