"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface Testimonial {
  name: string;
  role: string;
  city: string;
  avatar: string;
  color: string;
  stat: string;
  quote: string;
  featured: boolean;
}

interface Props {
  testimonials: Testimonial[];
}

const AVATAR_BG: Record<string, string> = {
  teal:   "bg-teal-500/20 text-teal-700 dark:text-teal-300",
  violet: "bg-violet-500/20 text-violet-700 dark:text-violet-300",
  amber:  "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  blue:   "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  pink:   "bg-pink-500/20 text-pink-700 dark:text-pink-300",
};

export function TestimonialsCarousel({ testimonials }: Props) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToCard = useCallback((index: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement;
    if (!card) return;
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
    setActiveIndex(index);
  }, []);

  const advance = useCallback(() => {
    setActiveIndex((prev) => {
      const next = (prev + 1) % testimonials.length;
      const el = carouselRef.current;
      if (!el) return next;
      const card = el.children[next] as HTMLElement;
      if (card) {
        el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
      }
      return next;
    });
  }, [testimonials.length]);

  // Keep ref in sync without restarting the interval
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Stable interval — only restarts if testimonials.length changes
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!isPausedRef.current) advance();
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [advance]);

  function handleScroll() {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = (el.children[0] as HTMLElement)?.offsetWidth ?? 1;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(idx, testimonials.length - 1));
  }

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel wrapper with fade edges */}
      <div className="relative">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10
          bg-gradient-to-r from-background to-transparent pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10
          bg-gradient-to-l from-background to-transparent pointer-events-none" />

        {/* Scrollable row */}
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex gap-5 overflow-x-auto scroll-smooth
            snap-x snap-mandatory pb-4
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {testimonials.map((t) => {
            const avatarClass = AVATAR_BG[t.color] ?? "bg-primary/20 text-primary";
            return (
              <div
                key={t.name}
                className="relative snap-center flex-shrink-0
                  w-[85vw] sm:w-[420px] lg:w-[380px]
                  bg-card border border-border rounded-2xl p-6"
              >
                {/* Decorative quote icon */}
                <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />

                {/* Header: avatar + name + role */}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    avatarClass
                  )}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role} · {t.city}</p>
                  </div>
                </div>

                {/* Stat chip */}
                <div className="mt-3">
                  <span className="inline-flex items-center
                    bg-primary/10 text-primary text-xs font-semibold
                    px-3 py-1 rounded-full">
                    {t.stat}
                  </span>
                </div>

                {/* Quote */}
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToCard(i)}
            aria-label={`Go to testimonial ${i + 1}`}
            className={cn(
              "h-2 rounded-full transition-all duration-200",
              activeIndex === i
                ? "bg-primary w-6"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2"
            )}
          />
        ))}
      </div>
    </div>
  );
}
