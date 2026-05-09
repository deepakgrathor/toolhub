"use client";

import { useState } from "react";
import { Coins, Loader2, CheckCircle } from "lucide-react";
import { useCreditStore } from "@/store/credits-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface PackData {
  _id: string;
  name: string;
  credits: number;
  priceInr: number;
  isFeatured: boolean;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  theme: { color: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-checkout-js")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface Props {
  pack: PackData;
}

export function BuyCreditsButton({ pack }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const syncFromServer = useCreditStore((s) => s.syncFromServer);

  async function handleBuy() {
    setLoading(true);
    try {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack._id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("[BuyCreditsButton] Purchase failed:", data.error);
        toast.error("Payment failed. Please try again.");
        setLoading(false);
        return;
      }

      const { orderId, amount, currency } = await res.json();

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        console.error("[BuyCreditsButton] Failed to load Razorpay script");
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount,
        currency,
        order_id: orderId,
        name: "SetuLix",
        description: `${pack.name} — ${pack.credits} credits`,
        theme: { color: "#7c3aed" },
        handler: async () => {
          setLoading(false);
          await syncFromServer();
          setSuccess(true);
          toast.success("Credits added successfully!");
          setTimeout(() => setSuccess(false), 3000);
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.open();
    } catch (err) {
      console.error("[BuyCreditsButton] Unexpected error:", err);
      toast.error("Payment failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleBuy}
      disabled={loading || success}
      className={cn(
        "mt-auto w-full rounded-lg py-2 text-sm font-medium text-center transition-opacity",
        "flex items-center justify-center gap-2",
        "disabled:cursor-not-allowed disabled:opacity-70",
        pack.isFeatured
          ? "bg-[#7c3aed] text-white hover:opacity-90"
          : "border border-border text-foreground hover:bg-white/5"
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : success ? (
        <>
          <CheckCircle className="h-4 w-4 text-[#10b981]" />
          Credits Added!
        </>
      ) : (
        <>
          <Coins className="h-4 w-4" />
          Buy Credits
        </>
      )}
    </button>
  );
}
