"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle, XCircle, Clock, Loader2, Smartphone, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaygicCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  upiIntent: string;
  phonePeLink: string;
  paytmLink: string;
  gpayLink: string;
  dynamicQR: string;
  expiresIn: number;
  onSuccess: () => void;
  onFailure: () => void;
  onExpired: () => void;
}

type PollStatus = "idle" | "polling" | "success" | "failed" | "expired";

export function PaygicCheckoutModal({
  isOpen,
  onClose,
  orderId,
  amount,
  upiIntent,
  phonePeLink,
  paytmLink,
  gpayLink,
  dynamicQR,
  expiresIn,
  onSuccess,
  onFailure,
  onExpired,
}: PaygicCheckoutModalProps) {
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const [checking, setChecking] = useState(false);
  const [pollStatus, setPollStatus] = useState<PollStatus>("idle");
  const [activeTab, setActiveTab] = useState<"qr" | "apps">("qr");
  const pollIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  async function checkStatus() {
    try {
      const res = await fetch(`/api/payments/verify?order_id=${orderId}`);
      const data = await res.json();

      if (data.status === "paid") {
        clearInterval(pollIntervalRef.current);
        clearInterval(countdownRef.current);
        setPollStatus("success");
        setTimeout(onSuccess, 1500);
      } else if (data.status === "failed") {
        clearInterval(pollIntervalRef.current);
        clearInterval(countdownRef.current);
        setPollStatus("failed");
        setTimeout(onFailure, 1500);
      }
    } catch {
      // silent — keep polling
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    setTimeLeft(expiresIn);
    setPollStatus("polling");
    setActiveTab("qr");
    setChecking(false);

    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          clearInterval(pollIntervalRef.current);
          setPollStatus("expired");
          onExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    pollIntervalRef.current = setInterval(() => {
      checkStatus();
    }, 3000);

    return () => {
      clearInterval(pollIntervalRef.current);
      clearInterval(countdownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, orderId]);

  async function handleManualCheck() {
    setChecking(true);
    await checkStatus();
    setChecking(false);
  }

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const timerColor =
    timeLeft > 120 ? "text-green-500" : timeLeft > 60 ? "text-amber-500" : "text-red-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">

        {/* Success state */}
        {pollStatus === "success" && (
          <div className="py-12 text-center space-y-3 px-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <p className="text-xl font-bold text-foreground">Payment Successful!</p>
            <p className="text-sm text-muted-foreground">Redirecting...</p>
          </div>
        )}

        {/* Failed state */}
        {pollStatus === "failed" && (
          <div className="py-12 text-center space-y-4 px-6">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <p className="text-xl font-bold text-foreground">Payment Failed</p>
            <p className="text-sm text-muted-foreground">No amount was deducted.</p>
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Expired state */}
        {pollStatus === "expired" && (
          <div className="py-12 text-center space-y-4 px-6">
            <Clock className="h-16 w-16 text-amber-500 mx-auto" />
            <p className="text-xl font-bold text-foreground">Payment Link Expired</p>
            <p className="text-sm text-muted-foreground">
              Please try again with a new payment request.
            </p>
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Polling (main) state */}
        {pollStatus === "polling" && (
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Complete Your Payment</h2>
                <p className="text-2xl font-bold text-foreground mt-0.5">₹{amount.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Expires in</p>
                <p className={cn("text-lg font-mono font-bold", timerColor)}>{timeDisplay}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex rounded-lg border border-border bg-muted/30 p-1 w-fit">
              {(["qr", "apps"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                    activeTab === tab
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab === "qr" ? "Scan QR" : "UPI Apps"}
                </button>
              ))}
            </div>

            {/* QR tab */}
            {activeTab === "qr" && (
              <div className="flex flex-col items-center gap-3">
                {dynamicQR ? (
                  <img
                    src={dynamicQR}
                    alt="Payment QR Code"
                    className="w-48 h-48 rounded-xl border border-border object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-xl border border-border bg-muted/30 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground text-center px-4">QR not available</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">Scan with any UPI app</p>
                <p className="text-xs text-muted-foreground/60">PhonePe • GPay • Paytm • BHIM</p>
              </div>
            )}

            {/* Apps tab */}
            {activeTab === "apps" && (
              <div className="flex flex-col gap-3">
                <a
                  href={phonePeLink || upiIntent || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full rounded-lg px-4 py-3 text-white font-medium text-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#5f259f" }}
                >
                  <Smartphone className="h-4 w-4 shrink-0" />
                  Pay with PhonePe
                </a>
                <a
                  href={gpayLink || upiIntent || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full rounded-lg border border-border px-4 py-3 text-foreground font-medium text-sm bg-card hover:bg-muted/50 transition-colors"
                >
                  <Smartphone className="h-4 w-4 shrink-0" />
                  Pay with Google Pay
                </a>
                <a
                  href={paytmLink || upiIntent || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full rounded-lg px-4 py-3 text-white font-medium text-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#00BAF2" }}
                >
                  <Smartphone className="h-4 w-4 shrink-0" />
                  Pay with Paytm
                </a>
              </div>
            )}

            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2">
              {checking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Checking...</span>
                </>
              ) : (
                <>
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-muted-foreground">Waiting for payment...</span>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-2 pt-1 border-t border-border">
              <button
                onClick={handleManualCheck}
                disabled={checking}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checking && <Loader2 className="h-4 w-4 animate-spin" />}
                I&apos;ve completed the payment
              </button>
              <button
                onClick={onClose}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Close icon for terminal states */}
        {(pollStatus === "failed" || pollStatus === "expired") && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
