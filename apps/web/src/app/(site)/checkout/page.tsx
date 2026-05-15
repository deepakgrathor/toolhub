"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock, Shield, CheckCircle, Loader2,
  Building2, User, ChevronDown, Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { PaygicCheckoutModal } from "@/components/ui/PaygicCheckoutModal";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ItemDetails {
  type: "plan" | "pack";
  name: string;
  credits: number;
  cycle: "monthly" | "yearly" | null;
  monthlyRate: number | null;
  subtotal: number;
  gstAmount: number;
  total: number;
}

interface BillingProfile {
  accountType: "individual" | "business";
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  businessName?: string;
  gstState?: string;
  contactPerson?: string;
}

interface PaygicOrderData {
  orderId: string;
  upiIntent?: string;
  phonePeLink?: string;
  paytmLink?: string;
  gpayLink?: string;
  dynamicQR?: string;
  expiresIn?: number;
}

// Cashfree JS instance type (dynamic import)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CashfreeInstance = any;

// ── Validation ────────────────────────────────────────────────────────────────

const individualSchema = z.object({
  fullName: z.string().min(2, "Name required"),
  addressLine1: z.string().min(5, "Address required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  pincode: z.string().regex(/^\d{6}$/, "Valid 6-digit PIN required"),
});

const businessSchema = z.object({
  businessName: z.string().min(2, "Business name required"),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Valid GSTIN required"),
  contactPerson: z.string().min(2, "Contact person required"),
  addressLine1: z.string().min(5, "Address required"),
  city: z.string().min(2, "City required"),
  pincode: z.string().regex(/^\d{6}$/, "Valid 6-digit PIN required"),
});

const GST_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir",
  "Puducherry", "Chandigarh",
];

const inputCls = "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/50";

// ── Checkout page ─────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") as "plan" | "pack" | null;
  const slug = searchParams.get("slug");
  const id = searchParams.get("id");
  const cycle = (searchParams.get("cycle") ?? "monthly") as "monthly" | "yearly";

  const [item, setItem] = useState<ItemDetails | null>(null);
  const [itemLoading, setItemLoading] = useState(true);
  const [accountType, setAccountType] = useState<"individual" | "business">("individual");
  const [loading, setLoading] = useState(false);
  const [saveBilling, setSaveBilling] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payError, setPayError] = useState<string | null>(null);
  const [cashfree, setCashfree] = useState<CashfreeInstance>(null);
  const [activeGateway, setActiveGateway] = useState<string>("cashfree");

  // Paygic modal state
  const [paygicModalOpen, setPaygicModalOpen] = useState(false);
  const [paygicOrderData, setPaygicOrderData] = useState<PaygicOrderData | null>(null);
  const [successRedirecting, setSuccessRedirecting] = useState(false);

  // Individual fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [gstin, setGstin] = useState("");

  // Business fields
  const [businessName, setBusinessName] = useState("");
  const [gstState, setGstState] = useState("");
  const [contactPerson, setContactPerson] = useState("");

  // Fetch active gateway
  useEffect(() => {
    fetch("/api/payments/active-gateway")
      .then((r) => r.json())
      .then((d) => setActiveGateway(d.gatewaySlug || "cashfree"))
      .catch(() => null);
  }, []);

  // Initialize Cashfree JS SDK (only when needed)
  useEffect(() => {
    if (activeGateway !== "cashfree") return;
    import("@cashfreepayments/cashfree-js").then(({ load }) => {
      load({ mode: (process.env.NEXT_PUBLIC_CASHFREE_MODE as "sandbox" | "production") || "sandbox" })
        .then(setCashfree)
        .catch(() => console.error("Failed to load Cashfree JS"));
    });
  }, [activeGateway]);

  // Redirect if pack checkout is missing id
  useEffect(() => {
    if (type === "pack" && !id) {
      router.replace("/pricing#credit-packs");
    }
  }, [type, id, router]);

  // Load item details
  useEffect(() => {
    if (!type) return;
    if (type === "pack" && !id) return;
    const params = new URLSearchParams({ type });
    if (slug) params.set("slug", slug);
    if (id) params.set("id", id);
    if (cycle) params.set("cycle", cycle);

    fetch(`/api/checkout/item-details?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setItem(d as ItemDetails))
      .catch(() => toast.error("Failed to load item details"))
      .finally(() => setItemLoading(false));
  }, [type, slug, id, cycle]);

  // Load saved billing profile
  useEffect(() => {
    fetch("/api/user/billing-profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: BillingProfile | null) => {
        if (!d) return;
        setAccountType(d.accountType ?? "individual");
        setFullName(d.fullName ?? "");
        setPhone(d.phone ?? "");
        setAddressLine1(d.addressLine1 ?? "");
        setAddressLine2(d.addressLine2 ?? "");
        setCity(d.city ?? "");
        setState(d.state ?? "");
        setPincode(d.pincode ?? "");
        setGstin(d.gstin ?? "");
        setBusinessName(d.businessName ?? "");
        setGstState(d.gstState ?? "");
        setContactPerson(d.contactPerson ?? "");
      })
      .catch(() => null);
  }, []);

  function validate(): boolean {
    const data = accountType === "individual"
      ? { fullName, addressLine1, city, state, pincode }
      : { businessName, gstin, contactPerson, addressLine1, city, pincode };

    const schema = accountType === "individual" ? individualSchema : businessSchema;
    const result = schema.safeParse(data);

    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) errs[String(e.path[0])] = e.message;
      });
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  }

  async function handlePayment() {
    setPayError(null);

    if (!validate()) return;

    if (activeGateway === "cashfree" && !cashfree) {
      setPayError("Payment gateway is loading. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const billingDetails = {
        accountType,
        fullName: accountType === "individual" ? fullName : contactPerson,
        phone,
        businessName: accountType === "business" ? businessName : undefined,
        gstin: gstin || undefined,
        address: addressLine1 + (addressLine2 ? ", " + addressLine2 : ""),
        city,
        state: accountType === "individual" ? state : gstState,
        pincode,
      };

      const orderPayload =
        type === "pack"
          ? { type: "credit_pack" as const, packId: id!, billingDetails, saveBilling }
          : { type: "plan" as const, planSlug: slug!, billingCycle: cycle, billingDetails, saveBilling };

      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        let errMsg = "Failed to create order. Please try again.";
        try {
          const errData = await res.json();
          if (errData?.error) errMsg = errData.error;
        } catch { /* response was not JSON */ }
        throw new Error(errMsg);
      }

      let orderData: Record<string, unknown>;
      try {
        orderData = await res.json();
      } catch {
        throw new Error("Unexpected response from server. Please try again.");
      }

      if (orderData.gatewaySlug === "paygic") {
        setPaygicOrderData(orderData as unknown as PaygicOrderData);
        setPaygicModalOpen(true);
        setLoading(false);
        return;
      }

      // Cashfree popup
      cashfree.checkout({
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: "_modal",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setPayError(msg);
      setLoading(false);
    }
  }

  function fieldError(field: string) {
    return errors[field] ? (
      <p className="text-xs text-destructive mt-1">{errors[field]}</p>
    ) : null;
  }

  const payButtonDisabled =
    loading ||
    !item ||
    (activeGateway === "cashfree" && !cashfree);

  const payButtonText = activeGateway === "paygic"
    ? `Pay ₹${item?.total?.toFixed(2) ?? "..."} via UPI`
    : `Pay ₹${item?.total?.toFixed(2) ?? "..."}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

        {/* ── Left: Billing form ─────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Account type toggle */}
          <div className="flex rounded-lg border border-border bg-muted/30 p-1 w-fit">
            {(["individual", "business"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setAccountType(t)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors capitalize",
                  accountType === t
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "individual" ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                {t}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Billing Details</h2>

            {accountType === "individual" ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name *</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} placeholder="Your full name" />
                    {fieldError("fullName")}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+91 9876543210" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Address Line 1 *</label>
                  <input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className={inputCls} placeholder="House/Building/Street" />
                  {fieldError("addressLine1")}
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Address Line 2</label>
                  <input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} className={inputCls} placeholder="Area, Landmark (optional)" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">City *</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="Mumbai" />
                    {fieldError("city")}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">State *</label>
                    <div className="relative">
                      <select value={state} onChange={(e) => setState(e.target.value)} className={cn(inputCls, "appearance-none pr-8")}>
                        <option value="">Select</option>
                        {GST_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                    {fieldError("state")}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">PIN *</label>
                    <input value={pincode} onChange={(e) => setPincode(e.target.value)} className={inputCls} placeholder="400001" maxLength={6} />
                    {fieldError("pincode")}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    GST Number <span className="text-muted-foreground/50 font-normal">(optional — for GST invoice)</span>
                  </label>
                  <input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} className={cn(inputCls, "font-mono")} placeholder="22AAAAA0000A1Z5" maxLength={15} />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Business Name *</label>
                    <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} placeholder="Company Pvt Ltd" />
                    {fieldError("businessName")}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">GSTIN *</label>
                    <input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} className={cn(inputCls, "font-mono")} placeholder="22AAAAA0000A1Z5" maxLength={15} />
                    {fieldError("gstin")}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">GST State *</label>
                    <div className="relative">
                      <select value={gstState} onChange={(e) => setGstState(e.target.value)} className={cn(inputCls, "appearance-none pr-8")}>
                        <option value="">Select state</option>
                        {GST_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Contact Person *</label>
                    <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={inputCls} placeholder="Full name" />
                    {fieldError("contactPerson")}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone *</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+91 9876543210" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">PIN *</label>
                    <input value={pincode} onChange={(e) => setPincode(e.target.value)} className={inputCls} placeholder="400001" maxLength={6} />
                    {fieldError("pincode")}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Address Line 1 *</label>
                  <input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className={inputCls} placeholder="Office/Building/Street" />
                  {fieldError("addressLine1")}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Address Line 2</label>
                    <input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} className={inputCls} placeholder="Area, Landmark" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">City *</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="Mumbai" />
                    {fieldError("city")}
                  </div>
                </div>
              </>
            )}

            {/* Save billing checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveBilling}
                onChange={(e) => setSaveBilling(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm text-muted-foreground">Save billing details for next time</span>
            </label>
          </div>
        </div>

        {/* ── Right: Order summary (sticky) ─────────────────────────────── */}
        <div className="lg:sticky lg:top-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Order Summary</h2>

            {itemLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-5 rounded bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : item ? (
              <>
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.credits} credits{item.type === "plan" ? " / month" : ""}
                  </p>
                  {item.cycle === "yearly" && item.monthlyRate != null && (
                    <p className="text-xs text-primary mt-1 font-medium">
                      ₹{item.monthlyRate}/mo × 12 months
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">₹{item.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span className="text-foreground">₹{item.gstAmount?.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground text-base">₹{item.total?.toFixed(2)}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No item selected</p>
            )}

            {/* Pay button */}
            <button
              onClick={handlePayment}
              disabled={payButtonDisabled}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : activeGateway === "paygic" ? (
                <>
                  <Smartphone className="h-4 w-4" />
                  {payButtonText}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  {payButtonText}
                </>
              )}
            </button>

            {/* Payment error */}
            {payError && (
              <p className="text-sm text-red-500 text-center -mt-1">{payError}</p>
            )}

            {/* Trust indicators */}
            <div className="space-y-2 pt-1 border-t border-border">
              {activeGateway === "paygic" ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Smartphone className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span>Secured by Paygic — UPI Payment</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span>Secured by Cashfree</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5 text-green-500 shrink-0" />
                <span>256-bit SSL Encryption</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                <span>Money-back guaranteed on failed payments</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Full-page success loader — shown while navigating to /payment/return */}
      {successRedirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/95 backdrop-blur-sm">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Processing your payment...</p>
        </div>
      )}

      {/* Paygic checkout modal */}
      {paygicOrderData && (
        <PaygicCheckoutModal
          isOpen={paygicModalOpen}
          onClose={() => {
            setPaygicModalOpen(false);
            setPaygicOrderData(null);
          }}
          orderId={paygicOrderData.orderId}
          amount={item?.total || 0}
          upiIntent={paygicOrderData.upiIntent || ""}
          phonePeLink={paygicOrderData.phonePeLink || ""}
          paytmLink={paygicOrderData.paytmLink || ""}
          gpayLink={paygicOrderData.gpayLink || ""}
          dynamicQR={paygicOrderData.dynamicQR || ""}
          expiresIn={paygicOrderData.expiresIn || 300}
          onSuccess={() => {
            setPaygicModalOpen(false);
            setSuccessRedirecting(true);
            router.push(`/payment/return?order_id=${paygicOrderData.orderId}`);
          }}
          onFailure={() => {
            setPaygicModalOpen(false);
            setPayError("Payment failed. Please try again.");
          }}
          onExpired={() => {
            setPaygicModalOpen(false);
            setPayError("Payment link expired. Please try again.");
          }}
        />
      )}
    </div>
  );
}
