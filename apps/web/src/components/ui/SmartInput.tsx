"use client";

import { useRef, useEffect, useState } from "react";
import { Building2, Plus, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAutofill } from "@/hooks/useAutofill";
import type { AutofillData } from "@/lib/autofill";

const PLACEHOLDERS: Record<keyof AutofillData, string> = {
  businessName: "Enter business name",
  phone: "Enter phone number",
  address: "Enter address",
  gstNumber: "Enter GST number",
  gstState: "Enter state",
  email: "Enter email",
  ownerName: "Enter your name",
};

interface SmartInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  field: keyof AutofillData;
  value: string;
  onChange: (val: string) => void;
}

export function SmartInput({
  field,
  value,
  onChange,
  className,
  placeholder,
  ...rest
}: SmartInputProps) {
  const { data } = useAutofill();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTempInput, setShowTempInput] = useState(false);
  const [tempValue, setTempValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const tempRef = useRef<HTMLInputElement>(null);

  const suggestion = data?.[field] ?? null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowTempInput(false);
        setTempValue("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowDropdown(false);
        setShowTempInput(false);
        setTempValue("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (showTempInput && tempRef.current) {
      tempRef.current.focus();
    }
  }, [showTempInput]);

  const handleFocus = () => {
    if (suggestion) setShowDropdown(true);
  };

  const handleSelectSuggestion = () => {
    onChange(suggestion!);
    setShowDropdown(false);
    setShowTempInput(false);
  };

  const handleUseDifferent = () => {
    setShowTempInput(true);
  };

  const handleConfirmTemp = () => {
    if (tempValue.trim()) {
      onChange(tempValue);
    }
    setShowDropdown(false);
    setShowTempInput(false);
    setTempValue("");
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        placeholder={placeholder ?? PLACEHOLDERS[field]}
        className={className}
      />

      <AnimatePresence>
        {showDropdown && suggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 w-full z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden mt-1"
            style={{ maxHeight: "calc(100vh - 200px)" }}
          >
            {/* Row 1: profile suggestion */}
            <button
              type="button"
              onClick={handleSelectSuggestion}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-foreground hover:bg-muted/50 cursor-pointer transition-colors text-left"
            >
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{suggestion}</span>
            </button>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Row 2: use different value */}
            <button
              type="button"
              onClick={handleUseDifferent}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Use a different value</span>
            </button>

            {/* Row 3: temp input */}
            {showTempInput && (
              <>
                <div className="border-t border-border" />
                <div className="flex items-center gap-2 px-3 py-2">
                  <input
                    ref={tempRef}
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleConfirmTemp();
                      }
                    }}
                    placeholder={PLACEHOLDERS[field]}
                    className="flex-1 bg-muted/50 rounded-md border border-border text-sm px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent/50"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmTemp}
                    className="text-accent hover:text-accent/80 transition-colors shrink-0"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
