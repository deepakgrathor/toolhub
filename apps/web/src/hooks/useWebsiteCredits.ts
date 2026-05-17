"use client";

import { useState, useEffect, useMemo } from "react";
import type { WebsiteGeneratorInput } from "@/tools/website-generator/schema";

interface WebsiteCreditConfig {
  base: number;
  page2: number;
  page3: number;
  page4: number;
  testimonials: number;
  pricing: number;
  faq: number;
  team: number;
  whatsapp: number;
  maps: number;
  social: number;
  animation: number;
  darkMode: number;
  publish: number;
  update: number;
}

interface CreditBreakdownItem {
  label: string;
  credits: number;
}

interface UseWebsiteCreditsResult {
  total: number;
  breakdown: CreditBreakdownItem[];
  isLoading: boolean;
}

type FormValues = Pick<
  WebsiteGeneratorInput,
  "pages" | "sections" | "animation" | "darkMode"
>;

const DEFAULTS: WebsiteCreditConfig = {
  base: 50,
  page2: 15,
  page3: 15,
  page4: 15,
  testimonials: 3,
  pricing: 3,
  faq: 3,
  team: 3,
  whatsapp: 2,
  maps: 2,
  social: 1,
  animation: 5,
  darkMode: 5,
  publish: 10,
  update: 5,
};

export function useWebsiteCredits(values: FormValues): UseWebsiteCreditsResult {
  const [config, setConfig] = useState<WebsiteCreditConfig>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/website-credits")
      .then((res) => res.json())
      .then((data: WebsiteCreditConfig) => {
        if (!cancelled) {
          setConfig(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { breakdown, total } = useMemo(() => {
    const items: CreditBreakdownItem[] = [];

    const pageNum = Number(values.pages ?? "1");

    items.push({ label: `Base (${pageNum} page${pageNum > 1 ? "s" : ""})`, credits: config.base });

    if (pageNum >= 2) items.push({ label: "+ 2nd page", credits: config.page2 });
    if (pageNum >= 3) items.push({ label: "+ 3rd page", credits: config.page3 });
    if (pageNum >= 4) items.push({ label: "+ 4th page", credits: config.page4 });

    const s = values.sections ?? {};

    if (s.testimonials) items.push({ label: "+ Testimonials", credits: config.testimonials });
    if (s.pricing) items.push({ label: "+ Pricing", credits: config.pricing });
    if (s.faq) items.push({ label: "+ FAQ", credits: config.faq });
    if (s.team) items.push({ label: "+ Team", credits: config.team });
    if (s.whatsapp) items.push({ label: "+ WhatsApp button", credits: config.whatsapp });
    if (s.maps) items.push({ label: "+ Google Maps", credits: config.maps });
    if (s.social) items.push({ label: "+ Social links", credits: config.social });

    if (values.animation) items.push({ label: "+ Animations", credits: config.animation });
    if (values.darkMode) items.push({ label: "+ Dark mode", credits: config.darkMode });

    const total = items.reduce((sum, i) => sum + i.credits, 0);
    return { breakdown: items, total };
  }, [
    config,
    values.pages,
    values.sections?.testimonials,
    values.sections?.pricing,
    values.sections?.faq,
    values.sections?.team,
    values.sections?.whatsapp,
    values.sections?.maps,
    values.sections?.social,
    values.animation,
    values.darkMode,
  ]);

  return { total, breakdown, isLoading };
}
