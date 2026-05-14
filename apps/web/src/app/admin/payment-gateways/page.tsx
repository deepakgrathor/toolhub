"use client";

import { useState, useEffect } from "react";
import {
  CreditCard, CheckCircle, XCircle, Eye, EyeOff,
  Loader2, RefreshCw, Settings, Star, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GatewayDoc {
  _id: string;
  slug: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  priority: number;
  environment: "sandbox" | "production";
  config: {
    apiKey: string;
    secretKey: string;
    merchantId: string;
    webhookSecret: string;
    token: string;
    tokenGeneratedAt: string | null;
  };
  supports: {
    upi: boolean;
    cards: boolean;
    netbanking: boolean;
    wallets: boolean;
    qr: boolean;
  };
  description: string;
}

interface ConfigFormState {
  environment: "sandbox" | "production";
  apiKey: string;
  secretKey: string;
  merchantId: string;
  webhookSecret: string;
}

const COMING_SOON = ["razorpay", "payu"];

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/50";

function SupportBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={cn(
        "text-xs rounded-full px-2 py-0.5 border",
        active
          ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
          : "bg-muted/30 text-muted-foreground border-border"
      )}
    >
      {label}
    </span>
  );
}

function SecretInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(inputCls, "pr-10", disabled && "opacity-50 cursor-not-allowed")}
      />
      {!disabled && (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

export default function PaymentGatewaysPage() {
  const [gateways, setGateways] = useState<GatewayDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [configModal, setConfigModal] = useState<GatewayDoc | null>(null);
  const [configForm, setConfigForm] = useState<ConfigFormState>({
    environment: "sandbox",
    apiKey: "",
    secretKey: "",
    merchantId: "",
    webhookSecret: "",
  });
  const [saving, setSaving] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [testingSlug, setTestingSlug] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string }>>({});

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  async function fetchGateways() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gateways");
      const data = await res.json();
      setGateways(data.gateways || []);
    } catch {
      toast.error("Failed to load gateways");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGateways();
  }, []);

  function openConfig(gw: GatewayDoc) {
    setConfigModal(gw);
    setConfigForm({
      environment: gw.environment,
      apiKey: "",
      secretKey: "",
      merchantId: gw.config.merchantId.includes("*")
        ? ""
        : gw.config.merchantId,
      webhookSecret: "",
    });
  }

  async function handleSaveConfig() {
    if (!configModal) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/gateways/${configModal.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environment: configForm.environment,
          config: {
            apiKey: configForm.apiKey,
            secretKey: configForm.secretKey,
            merchantId: configForm.merchantId,
            webhookSecret: configForm.webhookSecret,
          },
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Gateway configuration saved");
      setConfigModal(null);
      fetchGateways();
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(slug: string) {
    setSettingDefault(slug);
    try {
      const res = await fetch(`/api/admin/gateways/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error();
      toast.success("Default gateway updated");
      fetchGateways();
    } catch {
      toast.error("Failed to set default");
    } finally {
      setSettingDefault(null);
    }
  }

  async function handleGenerateToken() {
    setGeneratingToken(true);
    try {
      const res = await fetch("/api/admin/gateways/paygic/generate-token", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Token generated successfully");
      fetchGateways();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Token generation failed");
    } finally {
      setGeneratingToken(false);
    }
  }

  async function handleTestConnection(slug: string) {
    setTestingSlug(slug);
    try {
      const res = await fetch(`/api/admin/gateways/${slug}/test`, {
        method: "POST",
      });
      const data = await res.json();
      setTestResult((prev) => ({ ...prev, [slug]: data }));
    } catch {
      setTestResult((prev) => ({
        ...prev,
        [slug]: { success: false, message: "Connection failed" },
      }));
    } finally {
      setTestingSlug(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Payment Gateways</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage payment gateway integrations
          </p>
        </div>
        <button
          onClick={fetchGateways}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Gateway cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-56 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gateways.map((gw) => {
            const isComingSoon = COMING_SOON.includes(gw.slug);
            const result = testResult[gw.slug];

            const supportLabels = [
              gw.supports.upi && "UPI",
              gw.supports.cards && "Cards",
              gw.supports.netbanking && "Netbanking",
              gw.supports.wallets && "Wallets",
              gw.supports.qr && "QR",
            ].filter(Boolean) as string[];

            return (
              <div
                key={gw.slug}
                className={cn(
                  "rounded-xl border bg-card p-5 space-y-4",
                  gw.isDefault ? "border-primary/50" : "border-border",
                  isComingSoon && "opacity-60"
                )}
              >
                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">{gw.name}</span>
                    {gw.isDefault && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30 rounded-full px-2 py-0.5">
                        Default
                      </span>
                    )}
                    {isComingSoon && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-muted/60 text-muted-foreground border border-border rounded-full px-2 py-0.5">
                        Soon
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-block h-2 w-2 rounded-full",
                        gw.isActive ? "bg-green-500" : "bg-muted-foreground/40"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium rounded-full px-2 py-0.5 border",
                        gw.environment === "production"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      )}
                    >
                      {gw.environment === "production" ? "Production" : "Sandbox"}
                    </span>
                  </div>
                </div>

                {/* Supports */}
                <div className="flex flex-wrap gap-1.5">
                  {supportLabels.map((label) => (
                    <SupportBadge key={label} label={label} active />
                  ))}
                  {supportLabels.length === 0 && (
                    <span className="text-xs text-muted-foreground">No methods configured</span>
                  )}
                </div>

                {/* Config info */}
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs">MID:</span>
                    <code className="text-xs font-mono text-foreground">
                      {gw.config.merchantId || "—"}
                    </code>
                  </div>
                  {gw.slug === "paygic" && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-xs">Token:</span>
                      {gw.config.token === "Generated" ? (
                        <span className="text-xs text-green-500 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Generated
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500 flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Not generated
                        </span>
                      )}
                    </div>
                  )}
                  {result && (
                    <div
                      className={cn(
                        "text-xs rounded-lg px-2 py-1 border",
                        result.success
                          ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      )}
                    >
                      {result.message}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
                  <button
                    onClick={() => openConfig(gw)}
                    disabled={isComingSoon}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Configure
                  </button>

                  {!gw.isDefault && !isComingSoon && (
                    <button
                      onClick={() => handleSetDefault(gw.slug)}
                      disabled={settingDefault === gw.slug}
                      className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      {settingDefault === gw.slug ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Star className="h-3.5 w-3.5" />
                      )}
                      Set Default
                    </button>
                  )}

                  {gw.slug === "paygic" && (
                    <button
                      onClick={handleGenerateToken}
                      disabled={generatingToken}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                    >
                      {generatingToken ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      Generate Token
                    </button>
                  )}

                  {!isComingSoon && (
                    <button
                      onClick={() => handleTestConnection(gw.slug)}
                      disabled={testingSlug === gw.slug}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {testingSlug === gw.slug ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                      Test
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Configure modal */}
      {configModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfigModal(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Configure {configModal.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{configModal.description}</p>
              </div>

              {/* Environment */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Environment
                </label>
                <div className="flex rounded-lg border border-border bg-muted/30 p-1 w-fit">
                  {(["sandbox", "production"] as const).map((env) => (
                    <button
                      key={env}
                      onClick={() => setConfigForm((f) => ({ ...f, environment: env }))}
                      className={cn(
                        "rounded-md px-4 py-1.5 text-xs font-medium transition-colors capitalize",
                        configForm.environment === env
                          ? "bg-primary text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paygic fields */}
              {configModal.slug === "paygic" && (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Merchant ID (MID) *
                      </label>
                      <input
                        type="text"
                        value={configForm.merchantId}
                        onChange={(e) =>
                          setConfigForm((f) => ({ ...f, merchantId: e.target.value }))
                        }
                        className={inputCls}
                        placeholder="Your Paygic MID"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Account Password *
                      </label>
                      <SecretInput
                        value={configForm.secretKey}
                        onChange={(v) => setConfigForm((f) => ({ ...f, secretKey: v }))}
                        placeholder="Your Paygic password"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Callback URL (auto-generated)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`${appUrl}/api/payments/webhook/paygic`}
                        className={cn(inputCls, "font-mono text-xs text-muted-foreground cursor-default")}
                      />
                    </div>
                    <p className="text-xs text-amber-500">
                      After saving, click &quot;Generate Token&quot; to activate Paygic.
                    </p>
                  </div>
                </>
              )}

              {/* Cashfree fields */}
              {configModal.slug === "cashfree" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      App ID (API Key) *
                    </label>
                    <input
                      type="text"
                      value={configForm.apiKey}
                      onChange={(e) => setConfigForm((f) => ({ ...f, apiKey: e.target.value }))}
                      className={inputCls}
                      placeholder="Cashfree App ID"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Secret Key *
                    </label>
                    <SecretInput
                      value={configForm.secretKey}
                      onChange={(v) => setConfigForm((f) => ({ ...f, secretKey: v }))}
                      placeholder="Cashfree Secret Key"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Webhook Secret *
                    </label>
                    <SecretInput
                      value={configForm.webhookSecret}
                      onChange={(v) => setConfigForm((f) => ({ ...f, webhookSecret: v }))}
                      placeholder="Cashfree Webhook Secret"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Callback URL (auto-generated)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`${appUrl}/api/payments/webhook/cashfree`}
                      className={cn(inputCls, "font-mono text-xs text-muted-foreground cursor-default")}
                    />
                  </div>
                </div>
              )}

              {/* Razorpay / PayU — disabled */}
              {(configModal.slug === "razorpay" || configModal.slug === "payu") && (
                <div className="rounded-lg border border-border bg-muted/20 p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {configModal.name} integration coming soon.
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex gap-3 pt-2 border-t border-border">
                <button
                  onClick={() => setConfigModal(null)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                {!COMING_SOON.includes(configModal.slug) && (
                  <button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
