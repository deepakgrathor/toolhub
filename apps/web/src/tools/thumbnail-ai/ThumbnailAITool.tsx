"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useAuthStore } from "@/store/auth-store"
import { usePaywallStore } from "@/store/paywall-store"
import { useCreditStore } from "@/store/credits-store"
import { usePresets } from "@/hooks/usePresets"
import { PresetSelector } from "@/components/ui/PresetSelector"
import { ThumbnailHistory } from "./ThumbnailHistory"
import { thumbnailAIConfig } from "./config"
import {
  PLATFORMS, SIZES, NICHES, MOODS, COLOR_THEMES,
  type ThumbnailAIInput,
} from "./schema"
import type { LucideIcon } from "lucide-react"
import {
  Image as ImageIcon, Coins, Loader2, Download, RefreshCw,
  User, Upload, X, Sparkles, AlarmClock,
  Youtube, Instagram, Linkedin, Twitter, Globe, Globe2,
} from "lucide-react"
import { toast } from "sonner"

// ── Platform display labels ────────────────────────────────────────────────

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  "instagram-post": "Instagram Post",
  "instagram-reels": "Instagram Reels",
  linkedin: "LinkedIn",
  twitter: "Twitter / X",
  blog: "Blog / Website",
  pinterest: "Pinterest",
}

// ── Platform icons ─────────────────────────────────────────────────────────

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  youtube: Youtube,
  "instagram-post": Instagram,
  "instagram-reels": Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  blog: Globe,
  pinterest: Globe2,
}

// ── Platform → ratio auto-selection ───────────────────────────────────────

const PLATFORM_RATIO: Record<string, string> = {
  youtube: "16:9",
  "instagram-post": "1:1",
  "instagram-reels": "9:16",
  linkedin: "16:9",
  twitter: "16:9",
  blog: "16:9",
  pinterest: "9:16",
}

// ── Ratio cards ────────────────────────────────────────────────────────────

const RATIO_CARDS = [
  { ratio: "16:9", sub: "Landscape", w: 48, h: 28, apiSize: "1536x1024" as const },
  { ratio: "1:1",  sub: "Square",    w: 32, h: 32, apiSize: "1024x1024" as const },
  { ratio: "4:5",  sub: "Portrait",  w: 26, h: 32, apiSize: "1024x1024" as const },
  { ratio: "9:16", sub: "Vertical",  w: 20, h: 36, apiSize: "1024x1536" as const },
]

// ── Template cards ─────────────────────────────────────────────────────────

const TEMPLATE_CARDS = [
  { id: "dark-finance", name: "Dark Finance", bgClass: "bg-slate-900" },
  { id: "neon-tech",    name: "Neon Tech",    bgClass: "bg-green-950" },
  { id: "warm-vlog",    name: "Warm Vlog",    bgClass: "bg-amber-950" },
  { id: "data-viz",     name: "Data Viz",     bgClass: "bg-blue-950"  },
  { id: "bold-red",     name: "Bold Red",     bgClass: "bg-red-950"   },
  { id: "clean-light",  name: "Clean Light",  bgClass: "bg-gray-100"  },
]

// ── Chip component ─────────────────────────────────────────────────────────

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
        active
          ? "bg-accent text-white border-accent"
          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
      }`}
    >
      {label}
    </button>
  )
}

// ── Animated section reveal ────────────────────────────────────────────────

function RevealSection({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null
  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
      {children}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ThumbnailAITool({
  creditCost: creditCostProp,
  faceAddonCost: faceAddonCostProp,
}: {
  creditCost?: number
  faceAddonCost?: number
}) {
  const baseCost = creditCostProp ?? thumbnailAIConfig.creditCost
  const faceAddonCost = faceAddonCostProp ?? 3

  const { status } = useSession()
  const { balance, deductLocally } = useCreditStore()
  const openAuthModal = useAuthStore((s) => s.openAuthModal)
  const openPaywall = usePaywallStore((s) => s.openPaywall)

  // Form state
  const [platform, setPlatform] = useState<string>("")
  const [apiSize, setApiSize] = useState<string>("")
  const [selectedRatio, setSelectedRatio] = useState<string>("")
  const [title, setTitle] = useState("")
  const [topic, setTopic] = useState("")
  const [niche, setNiche] = useState("")
  const [mood, setMood] = useState("")
  const [colorTheme, setColorTheme] = useState("Auto (recommended)")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [faceMode, setFaceMode] = useState<"ai" | "own" | "none">("ai")
  const [gender, setGender] = useState<"male" | "female">("male")
  const [faceFile, setFaceFile] = useState<File | null>(null)
  const [facePreviewUrl, setFacePreviewUrl] = useState<string | null>(null)

  // Dynamic credit cost
  const totalCredits = faceMode === "own" ? baseCost + faceAddonCost : baseCost

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [output, setOutput] = useState<{ imageUrl: string } | null>(null)
  const [lastInput, setLastInput] = useState<ThumbnailAIInput | null>(null)
  const [newThumbnail, setNewThumbnail] = useState<{ imageUrl: string; prompt: string } | null>(null)

  // Presets
  const [planSlug, setPlanSlug] = useState("free")
  const { presets, isFetched, fetchPresets } = usePresets("thumbnail-ai")
  const defaultLoadedRef = useRef(false)

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((d: { planSlug?: string }) => setPlanSlug(d.planSlug ?? "free"))
      .catch(() => null)
  }, [])

  useEffect(() => { fetchPresets() }, [fetchPresets])

  useEffect(() => {
    if (!isFetched || defaultLoadedRef.current) return
    const defaultPreset = presets.find((p) => p.isDefault)
    if (defaultPreset) {
      const inp = defaultPreset.inputs as Record<string, string>
      if (inp.platform) setPlatform(inp.platform)
      if (inp.title) setTitle(inp.title)
      if (inp.topic) setTopic(inp.topic)
      if (inp.niche) setNiche(inp.niche)
      if (inp.mood) setMood(inp.mood)
      if (inp.colorTheme) setColorTheme(inp.colorTheme)
      if (inp.faceMode) setFaceMode(inp.faceMode as "ai" | "own" | "none")
      if (inp.gender) setGender(inp.gender as "male" | "female")
      defaultLoadedRef.current = true
    }
  }, [isFetched, presets])

  // Platform → auto-select size + ratio
  useEffect(() => {
    if (platform && SIZES[platform as keyof typeof SIZES]) {
      setApiSize(SIZES[platform as keyof typeof SIZES].apiSize)
      setSelectedRatio(PLATFORM_RATIO[platform] ?? "16:9")
    }
  }, [platform])

  // Face file → preview URL
  useEffect(() => {
    if (faceFile) {
      const url = URL.createObjectURL(faceFile)
      setFacePreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setFacePreviewUrl(null)
    }
  }, [faceFile])

  const currentInputs = { platform, apiSize, title, topic, niche, mood, colorTheme, faceMode, gender }

  async function generate() {
    if (status === "unauthenticated") { openAuthModal("login"); return }
    if (balance < totalCredits) { openPaywall(thumbnailAIConfig.name, totalCredits); return }

    if (!platform) { toast.error("Please select a platform"); return }
    if (title.length < 3) { toast.error("Please enter a title"); return }
    if (topic.length < 10) { toast.error("Please describe your content"); return }
    if (faceMode === "own" && !faceFile) { toast.error("Please upload your photo"); return }

    let faceImageBase64: string | undefined
    if (faceMode === "own" && faceFile) {
      const arrayBuffer = await faceFile.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      let binary = ""
      bytes.forEach((b) => (binary += String.fromCharCode(b)))
      faceImageBase64 = btoa(binary)
    }

    const input: ThumbnailAIInput = {
      platform: platform as ThumbnailAIInput["platform"],
      apiSize: apiSize as ThumbnailAIInput["apiSize"],
      title,
      topic,
      niche: (niche as ThumbnailAIInput["niche"]) || undefined,
      mood: (mood as ThumbnailAIInput["mood"]) || undefined,
      colorTheme: (colorTheme as ThumbnailAIInput["colorTheme"]) || undefined,
      faceMode,
      gender: faceMode !== "none" ? gender : undefined,
      faceImageBase64,
      selectedTemplate: selectedTemplate ?? undefined,
    }

    setIsGenerating(true)
    setLastInput(input)

    try {
      const res = await fetch("/api/tools/thumbnail-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })

      if (res.status === 402) { openPaywall(thumbnailAIConfig.name, totalCredits); return }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { detail?: string }).detail ?? "generation_failed")
      }

      const json = await res.json()
      const result = json.output as { imageUrl: string }
      setOutput(result)
      deductLocally(totalCredits)
      setNewThumbnail({ imageUrl: result.imageUrl, prompt: title })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generation failed."
      toast.error(
        msg.includes("storage not configured")
          ? "Image storage not configured. Contact support."
          : "Generation failed. Please try again."
      )
    } finally {
      setIsGenerating(false)
    }
  }

  async function downloadImage() {
    if (!output) return
    try {
      const res = await fetch(output.imageUrl)
      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `thumbnail-${platform}-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      window.open(output.imageUrl, "_blank")
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="flex flex-col lg:flex-row">

        {/* LEFT PANEL — Form */}
        <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">

          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
              <ImageIcon className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{thumbnailAIConfig.name}</h1>
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                  {totalCredits} credits
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {thumbnailAIConfig.description}
              </p>
            </div>
          </div>

          {/* Preset selector */}
          <PresetSelector
            toolSlug="thumbnail-ai"
            currentInputs={currentInputs}
            planSlug={planSlug}
            onPresetLoad={(inputs) => {
              const inp = inputs as Record<string, string>
              if (inp.platform) setPlatform(inp.platform)
              if (inp.title) setTitle(inp.title)
              if (inp.topic) setTopic(inp.topic)
              if (inp.niche) setNiche(inp.niche)
              if (inp.mood) setMood(inp.mood)
              if (inp.colorTheme) setColorTheme(inp.colorTheme)
              if (inp.faceMode) setFaceMode(inp.faceMode as "ai" | "own" | "none")
              if (inp.gender) setGender(inp.gender as "male" | "female")
              toast.success("Preset loaded!")
            }}
          />

          <div className="space-y-5">

            {/* ── SECTION 1 — Platform + Size ────────────────────────────── */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Platform <span className="text-destructive">*</span>
              </label>

              {/* Platform chips with icons */}
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const Icon = PLATFORM_ICONS[p]
                  const isActive = platform === p
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                        isActive
                          ? "bg-accent text-white border-accent"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {PLATFORM_LABELS[p]}
                    </button>
                  )
                })}
              </div>

              {/* Size hint + ratio cards */}
              <RevealSection show={platform !== ""}>
                <div className="space-y-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    Size — auto-selected for {PLATFORM_LABELS[platform] ?? platform}. Change if needed.
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {RATIO_CARDS.map((card) => {
                      const isActive = selectedRatio === card.ratio
                      return (
                        <button
                          key={card.ratio}
                          type="button"
                          onClick={() => { setSelectedRatio(card.ratio); setApiSize(card.apiSize) }}
                          className={`rounded-lg p-2 text-center cursor-pointer transition-colors ${
                            isActive
                              ? "border-accent bg-accent/8"
                              : "border-border hover:border-foreground/30"
                          }`}
                          style={{ border: `1.5px solid ${isActive ? "var(--accent)" : "var(--border)"}` }}
                        >
                          {/* Visual rectangle */}
                          <div className="flex items-center justify-center" style={{ height: 44 }}>
                            <div
                              className={`rounded-sm border ${
                                isActive ? "border-accent bg-accent/15" : "border-border bg-muted/50"
                              }`}
                              style={{ width: card.w, height: card.h }}
                            />
                          </div>
                          <p className={`text-xs font-semibold mt-1 ${isActive ? "text-accent" : "text-foreground"}`}>
                            {card.ratio}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{card.sub}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </RevealSection>
            </div>

            {/* ── SECTION 2 — Content ────────────────────────────────────── */}
            <RevealSection show={platform !== ""}>
              <div className="space-y-4">
                <div className="border-t border-border" />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Title / Headline <span className="text-destructive">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground">Text that will appear on your thumbnail</p>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='e.g. "5 Mistakes That Kill Your GST Return"'
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Content topic <span className="text-destructive">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    What is your video/post about? More detail = better thumbnail
                  </p>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={3}
                    placeholder="e.g. GST filing mistakes Indian small businesses make — wrong HSN codes, missed deadlines, penalties"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none"
                  />
                </div>
              </div>
            </RevealSection>

            {/* ── SECTIONS 3 + 4 — Style + Template ─────────────────────── */}
            <RevealSection show={title.length >= 3}>
              <div className="space-y-4">
                <div className="border-t border-border" />

                {/* Section 3 header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Style</span>
                  <span className="text-xs text-muted-foreground">Niche + mood auto-picked if skipped</span>
                </div>

                {/* Niche */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Niche</p>
                  <div className="flex flex-wrap gap-2">
                    {NICHES.map((n) => (
                      <Chip key={n} label={n} active={niche === n} onClick={() => setNiche(niche === n ? "" : n)} />
                    ))}
                  </div>
                </div>

                {/* Mood */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Mood</p>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map((m) => (
                      <Chip key={m} label={m} active={mood === m} onClick={() => setMood(mood === m ? "" : m)} />
                    ))}
                  </div>
                </div>

                {/* Color theme */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Color theme</p>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_THEMES.map((c) => (
                      <Chip key={c} label={c} active={colorTheme === c} onClick={() => setColorTheme(c)} />
                    ))}
                  </div>
                </div>

                {/* Section 4 — Template */}
                <div className="border-t border-border" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Template</span>
                  <span className="text-xs text-muted-foreground">Pick a composition to follow</span>
                </div>

                <div className="bg-muted/30 rounded-xl p-3">
                  <div className="overflow-x-auto">
                    <div className="flex gap-2 pb-1" style={{ minWidth: "max-content" }}>
                      {TEMPLATE_CARDS.map((tpl) => {
                        const isActive = selectedTemplate === tpl.id
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => setSelectedTemplate(tpl.id)}
                            className="flex-shrink-0 w-24 text-left"
                          >
                            <div
                              className={`w-24 h-14 rounded-lg border overflow-hidden mb-1 ${tpl.bgClass} ${
                                isActive ? "border-accent" : "border-border"
                              }`}
                            />
                            <p className={`text-[10px] text-center ${
                              isActive ? "text-accent font-medium" : "text-muted-foreground"
                            }`}>
                              {tpl.name}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate(null)}
                    className="mt-2 text-xs text-muted-foreground underline cursor-pointer"
                  >
                    Skip template — let AI decide composition
                  </button>
                </div>
              </div>
            </RevealSection>

            {/* ── SECTION 5 — Face ───────────────────────────────────────── */}
            <RevealSection show={topic.length >= 10}>
              <div className="space-y-3">
                <div className="border-t border-border" />
                <div>
                  <label className="text-sm font-medium text-foreground">Face in thumbnail</label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Thumbnails with faces get higher CTR
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* AI Face */}
                  <button
                    type="button"
                    onClick={() => setFaceMode("ai")}
                    className={`rounded-xl border p-3 text-center transition-colors ${
                      faceMode === "ai"
                        ? "border-accent bg-accent/8"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <Sparkles className={`h-5 w-5 mx-auto mb-1.5 ${faceMode === "ai" ? "text-accent" : "text-muted-foreground"}`} />
                    <p className="text-xs font-medium text-foreground">AI Face</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{baseCost} cr</p>
                  </button>

                  {/* My Photo */}
                  <button
                    type="button"
                    onClick={() => setFaceMode("own")}
                    className={`rounded-xl border p-3 text-center transition-colors ${
                      faceMode === "own"
                        ? "border-accent bg-accent/8"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <User className={`h-5 w-5 mx-auto mb-1.5 ${faceMode === "own" ? "text-accent" : "text-muted-foreground"}`} />
                    <p className="text-xs font-medium text-foreground">My Photo</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{baseCost + faceAddonCost} cr</p>
                  </button>

                  {/* No Face */}
                  <button
                    type="button"
                    onClick={() => setFaceMode("none")}
                    className={`rounded-xl border p-3 text-center transition-colors ${
                      faceMode === "none"
                        ? "border-accent bg-accent/8"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <ImageIcon className={`h-5 w-5 mx-auto mb-1.5 ${faceMode === "none" ? "text-accent" : "text-muted-foreground"}`} />
                    <p className="text-xs font-medium text-foreground">No Face</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{baseCost} cr</p>
                  </button>
                </div>

                {/* Gender toggle — when AI face */}
                <RevealSection show={faceMode === "ai"}>
                  <div className="flex gap-2">
                    <Chip label="Male" active={gender === "male"} onClick={() => setGender("male")} />
                    <Chip label="Female" active={gender === "female"} onClick={() => setGender("female")} />
                  </div>
                </RevealSection>

                {/* Photo upload — when own face */}
                <RevealSection show={faceMode === "own"}>
                  <div className="space-y-2">
                    {facePreviewUrl ? (
                      <div className="relative w-20 h-20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={facePreviewUrl}
                          alt="Your photo"
                          className="w-20 h-20 rounded-xl object-cover border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => { setFaceFile(null); setFacePreviewUrl(null) }}
                          className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive p-0.5"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-5 cursor-pointer hover:border-accent/50 transition-colors">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground text-center">
                          Upload your photo — PNG/JPG, max 2MB
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Clear, well-lit photo = better face match
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            if (file.size > 2 * 1024 * 1024) {
                              toast.error("Photo must be under 2MB")
                              return
                            }
                            setFaceFile(file)
                          }}
                        />
                      </label>
                    )}
                  </div>
                </RevealSection>
              </div>
            </RevealSection>

            {/* ── Credit bar + Generate button ───────────────────────────── */}
            <RevealSection show={platform !== ""}>
              <div className="space-y-3 pt-1">
                <div className="rounded-lg bg-muted/40 px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {faceMode === "own"
                      ? `${baseCost} base + ${faceAddonCost} photo addon`
                      : "Credits required"}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {totalCredits} credits
                  </span>
                </div>

                {status === "unauthenticated" ? (
                  <button
                    type="button"
                    onClick={() => openAuthModal("login")}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
                  >
                    <Coins className="h-4 w-4" />Login to Generate
                  </button>
                ) : balance < totalCredits ? (
                  <button
                    type="button"
                    onClick={() => openPaywall(thumbnailAIConfig.name, totalCredits)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
                  >
                    <Coins className="h-4 w-4" />Buy Credits
                  </button>
                ) : (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={generate}
                      disabled={isGenerating}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {isGenerating
                        ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
                        : <><Coins className="h-4 w-4" />Generate Thumbnail — {totalCredits} credits</>
                      }
                    </button>
                    <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <AlarmClock className="h-3 w-3" />Takes 20–30 seconds
                    </p>
                  </div>
                )}
              </div>
            </RevealSection>

          </div>
        </div>

        {/* RIGHT PANEL — Output (unchanged) */}
        <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
          {!isGenerating && !output && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
              <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Your thumbnail will appear here</p>
              <p className="text-xs text-muted-foreground mt-1">
                Fill in the form and click Generate
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
              <p className="text-sm font-semibold text-foreground">Creating your thumbnail...</p>
              <p className="text-xs text-muted-foreground">
                {faceMode === "own"
                  ? "Using your photo with AI generation"
                  : "Building cinematic prompt with AI, then generating image"}
              </p>
              <p className="text-xs text-muted-foreground">This takes 20–30 seconds</p>
            </div>
          )}

          {!isGenerating && output && (
            <div className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={output.imageUrl}
                alt="Generated thumbnail"
                className="w-full rounded-xl border border-border object-cover"
              />
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                  {totalCredits} credits used
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={downloadImage}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />Download
                  </button>
                  <button
                    type="button"
                    onClick={() => lastInput && generate()}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 rounded-lg bg-accent/10 border border-accent/30 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-60 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />Regenerate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History gallery */}
      {status === "authenticated" && (
        <div className="border-t border-border px-4 md:px-6 pb-8">
          <ThumbnailHistory newThumbnail={newThumbnail} />
        </div>
      )}
    </div>
  )
}
