import { z } from "zod"

export const PLATFORMS = [
  "youtube",
  "instagram-post",
  "instagram-reels",
  "linkedin",
  "twitter",
  "blog",
  "pinterest",
] as const

export const SIZES = {
  youtube: { label: "1280×720 (16:9)", apiSize: "1536x1024" },
  "instagram-post": { label: "1080×1080 (1:1)", apiSize: "1024x1024" },
  "instagram-reels": { label: "1080×1920 (9:16)", apiSize: "1024x1536" },
  linkedin: { label: "1200×628 (1.91:1)", apiSize: "1536x1024" },
  twitter: { label: "1200×675 (16:9)", apiSize: "1536x1024" },
  blog: { label: "1200×630 (16:9)", apiSize: "1536x1024" },
  pinterest: { label: "1000×1500 (2:3)", apiSize: "1024x1536" },
} as const

export const NICHES = [
  "Finance & Business",
  "Tech & Gadgets",
  "Education",
  "Health & Fitness",
  "Lifestyle & Vlog",
  "Gaming",
  "Cooking & Food",
  "Motivation",
  "News & Current Affairs",
  "Travel",
  "Other",
] as const

export const MOODS = [
  "Urgency / Warning",
  "Curiosity / Mystery",
  "Excitement / Hype",
  "Shock / Surprise",
  "Professional / Trust",
  "Fun / Humor",
  "Motivational",
] as const

export const COLOR_THEMES = [
  "Auto (recommended)",
  "Dark & Bold",
  "Bright & Colorful",
  "Clean & Minimal",
  "Red & Black",
  "Blue & White",
  "Gold & Dark",
] as const

export const FACE_MODES = ["ai", "own", "none"] as const
export const GENDERS = ["male", "female"] as const

export const thumbnailAISchema = z.object({
  // Required
  platform: z.enum(PLATFORMS),
  apiSize: z.enum(["1536x1024", "1024x1024", "1024x1536"]),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  topic: z.string().min(10, "Please describe your content in at least 10 characters").max(500),

  // Optional style
  niche: z.enum(NICHES).optional(),
  mood: z.enum(MOODS).optional(),
  colorTheme: z.enum(COLOR_THEMES).optional(),

  // Face
  faceMode: z.enum(FACE_MODES).default("ai"),
  gender: z.enum(GENDERS).optional(),

  // Own face — base64 string (client converts File to base64 before sending)
  faceImageBase64: z.string().optional(),

  // Template composition — null means "let AI decide"
  selectedTemplate: z.string().optional(),
})

export type ThumbnailAIInput = z.infer<typeof thumbnailAISchema>
