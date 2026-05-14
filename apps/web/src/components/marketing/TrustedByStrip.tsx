'use client'

import type { FC } from 'react'

const TRUSTED_ITEMS = [
  { initials: "SP", name: "Sneha P.", role: "HR Manager", city: "Pune" },
  { initials: "RK", name: "Rahul K.", role: "YouTuber", city: "Delhi" },
  { initials: "AM", name: "Anjali M.", role: "Advocate", city: "Mumbai" },
  { initials: "VG", name: "Vikram G.", role: "SME Owner", city: "Surat" },
  { initials: "PS", name: "Priya S.", role: "Marketer", city: "Bangalore" },
  { initials: "AT", name: "Arjun T.", role: "CA", city: "Ahmedabad" },
  { initials: "NK", name: "Neha K.", role: "Content Creator", city: "Hyderabad" },
  { initials: "RS", name: "Ravi S.", role: "Business Owner", city: "Chennai" },
  { initials: "DM", name: "Divya M.", role: "HR Lead", city: "Noida" },
  { initials: "AK", name: "Amit K.", role: "Freelancer", city: "Jaipur" },
]

export const TrustedByStrip: FC = () => {
  return (
    <section className="py-10 overflow-hidden
      border-b border-border">

      <p className="text-center text-xs font-medium
        text-muted-foreground uppercase
        tracking-widest mb-6">
        Trusted by professionals across India
      </p>

      <div className="relative">
        {/* Left fade */}
        <div className="absolute left-0 top-0
          h-full w-20 z-10
          bg-gradient-to-r
          from-background to-transparent
          pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0
          h-full w-20 z-10
          bg-gradient-to-l
          from-background to-transparent
          pointer-events-none" />

        {/* Scrolling track — doubled for seamless loop */}
        <div className="flex gap-4
          animate-marquee-setulix whitespace-nowrap">
          {[...TRUSTED_ITEMS, ...TRUSTED_ITEMS].map(
            (item, i) => (
              <div
                key={i}
                className="inline-flex items-center
                  gap-2.5 bg-card border border-border
                  rounded-full px-4 py-2 shrink-0"
              >
                <div className="w-7 h-7 rounded-full
                  bg-primary/10 flex items-center
                  justify-center text-[10px] font-bold
                  text-primary shrink-0">
                  {item.initials}
                </div>
                <div>
                  <div className="text-xs font-medium
                    text-foreground leading-none">
                    {item.name}
                  </div>
                  <div className="text-[10px]
                    text-muted-foreground mt-0.5">
                    {item.role} · {item.city}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  )
}
