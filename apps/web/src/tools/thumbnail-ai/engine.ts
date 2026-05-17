import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db"
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared"
import { invalidateBalance } from "@/lib/credit-cache"
import { getSiteConfigValue } from "@/lib/site-config-cache"
import type { ThumbnailAIInput } from "./schema"

// ── Haiku system prompt ────────────────────────────────────────────────────

const HAIKU_SYSTEM_PROMPT = `You are a world-class YouTube thumbnail designer.
Your job is to write image generation prompts that produce
viral, high-CTR thumbnails matching the style of top Indian YouTubers.

OUTPUT RULES — STRICT:
— Output ONLY the image prompt. Nothing else.
— Length: 100-130 words. Every word must add visual detail.
— ABSOLUTELY NO text, letters, words, numbers, or characters
  in the image. Not even on documents, signs, or screens.
— Bottom 35% of image: pure dark gradient fade — completely
  empty — reserved for text overlay. No elements, no person,
  no objects in this zone.
— Face expression must be EXTREME and DRAMATIC — not subtle.
  Shocked wide eyes, mouth open, strong pointing gesture,
  or intense warning stare.
— Specific Indian context props: GST documents,
  rupee symbols (₹), tax forms, calculator, penalty notices
  — NOT generic warning triangles.
— Cinematic photography style — NOT stock photo style.
— High contrast — subject must pop against background.
— Person positioned right side, graphic elements left side.

COMPOSITION RULES:
16:9: Wide horizontal, person occupies right 45%,
      graphic elements fill left 40%,
      dark gradient bottom 35% (no elements here)
9:16: Tall vertical, bold center subject,
      top 60% has content, bottom 40% dark gradient
1:1:  Centered square, subject center-frame,
      elements surrounding

FACE RULES:
Indian Male: photorealistic Indian male, age appropriate
             for niche, EXTREME expression matching mood
Indian Female: photorealistic Indian female, age appropriate
               for niche, EXTREME expression matching mood
No Face: objects, charts, icons only — no humans at all

NICHE COLOR PALETTES — use EXACT colors:
Finance/Business: #0a0a1a deep navy bg, #ff3300 red accents,
                  #ffd700 gold highlights, harsh rim lighting
Tech/Gaming: #0d0d0d black bg, #00ff88 or #7c3aed neon,
             electric backlight
Education: #f8f8f0 clean white/cream bg, #2d5be3 blue accents,
           organized neat layout
Lifestyle/Vlog: warm golden hour tones, soft natural light
Gaming: #0a0a0f dark bg, intense neon RGB lighting
Motivation: single bold color bg, dramatic spotlight center

MOOD TO EXTREME VISUAL:
Urgency/Warning: person looking directly at camera with
                 shocked-warning expression, one finger
                 pointing up, red glow on face from elements,
                 scattered rupee/document props with
                 danger markers
Curiosity/Mystery: half-turned face, one eyebrow raised,
                   mysterious floating elements
Excitement/Hype: huge open smile, arms raised, bright
                 explosive elements
Shock/Surprise: both hands on cheeks or jaw dropped,
                extreme wide eyes
Professional/Trust: confident direct gaze, clean
                    authoritative composition

ALWAYS END PROMPT WITH:
"Photorealistic, cinematic DSLR quality, dramatic studio
lighting, sharp focus on face, dark gradient in bottom 35%
of frame for text overlay, zero text or characters anywhere
in image, 16:9 YouTube thumbnail composition"`

// ── Build Haiku user message ───────────────────────────────────────────────

function buildHaikuMessage(input: ThumbnailAIInput): string {
  const compositionMap: Record<string, string> = {
    "1536x1024": "wide horizontal 16:9 composition",
    "1024x1024": "square 1:1 centered composition",
    "1024x1536": "tall vertical 9:16 composition",
  }

  const faceInstruction =
    input.faceMode === "own"
      ? "A person's face will be composited in later — leave a natural face-shaped space on the right side with appropriate background around it"
      : input.faceMode === "ai"
      ? `AI Face ${input.gender ?? "male"} — include appropriate Indian person with expression matching mood`
      : "No Face — use objects, environments, icons relevant to the topic"

  return `Platform: ${input.platform}
Composition: ${compositionMap[input.apiSize] ?? "horizontal"}
Title (text overlay needed for this text — reserve space): "${input.title}"
Topic: ${input.topic}
Niche: ${input.niche ?? "General"}
Mood: ${input.mood ?? "Professional / Trust"}
Color theme: ${input.colorTheme ?? "Auto (recommended)"}
Face: ${faceInstruction}

Generate the image prompt now.

CRITICAL REMINDERS:
- Zero text anywhere in image
- Bottom 35% must be pure dark gradient — nothing there
- Face expression must be EXTREME not subtle
- Specific props for this niche, not generic symbols
- Cinematic style, not stock photo style`
}

// ── Fallback prompt if Haiku fails ─────────────────────────────────────────

function buildFallbackPrompt(input: ThumbnailAIInput): string {
  return `Professional ${input.platform} thumbnail, topic: "${input.topic}", title text area reserved, high contrast professional photography, dramatic lighting, photorealistic style, no watermarks, no text in image`
}

// ── Haiku call ─────────────────────────────────────────────────────────────

async function buildImagePromptWithHaiku(input: ThumbnailAIInput): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return buildFallbackPrompt(input)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 300,
        system: HAIKU_SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildHaikuMessage(input) }],
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) return buildFallbackPrompt(input)

    const data = await res.json() as { content?: { type: string; text: string }[] }
    const text = data.content?.find((b) => b.type === "text")?.text?.trim()
    return text && text.length > 20 ? text : buildFallbackPrompt(input)
  } catch {
    return buildFallbackPrompt(input)
  }
}

// ── R2 upload ──────────────────────────────────────────────────────────────

async function uploadToR2(buffer: Buffer, key: string): Promise<string> {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error("Image storage not configured. Contact support.")
  }

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3")
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })

  await client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: "image/png",
  }))

  return `${publicUrl.replace(/\/$/, "")}/${key}`
}

// ── Main execute ───────────────────────────────────────────────────────────

export async function execute(
  input: ThumbnailAIInput,
  context: ToolEngineContext
): Promise<ToolEngineResult> {
  await connectDB()

  // Fetch base credit cost from ToolConfig
  const toolConfigDoc = await ToolConfig.findOne({ toolSlug: context.toolSlug })
    .select("creditCost")
    .lean()
  const baseCost = toolConfigDoc?.creditCost ?? 10

  // Fetch addon cost from SiteConfig if own face selected
  const addonCost =
    input.faceMode === "own"
      ? (await getSiteConfigValue("thumbnail_face_addon_credits", 3)) as number
      : 0

  const creditCost = baseCost + addonCost

  // R2 check early
  if (
    !process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
    !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    !process.env.CLOUDFLARE_R2_BUCKET_NAME ||
    !process.env.CLOUDFLARE_R2_PUBLIC_URL
  ) {
    throw new Error("Image storage not configured. Contact support.")
  }

  const openAIKey = process.env.OPENAI_API_KEY
  if (!openAIKey) throw new Error("OpenAI API key not configured.")

  // Credit check
  const hasBalance = await CreditService.checkBalance(context.userId, creditCost)
  if (!hasBalance) {
    const balance = await CreditService.getBalance(context.userId)
    throw new InsufficientCreditsError(balance, creditCost)
  }

  // Stage 1: Haiku builds cinematic prompt
  const imagePrompt = await buildImagePromptWithHaiku(input)

  // Stage 2: gpt-image-1.5 Generation
  let imageBuffer: Buffer

  if (input.faceMode === "own" && input.faceImageBase64) {
    // Image edit mode — user's face as reference
    const formData = new FormData()
    const faceBuffer = Buffer.from(input.faceImageBase64, "base64")
    const faceBlob = new Blob([faceBuffer], { type: "image/png" })
    formData.append("image", faceBlob, "face.png")
    formData.append("prompt", imagePrompt)
    formData.append("model", "gpt-image-1.5")
    formData.append("size", input.apiSize)
    formData.append("quality", "low")
    formData.append("n", "1")

    const editRes = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAIKey}` },
      body: formData,
    })

    if (!editRes.ok) {
      throw new Error(`GPT-Image-1.5 edit error ${editRes.status}: ${await editRes.text()}`)
    }

    const editData = await editRes.json() as { data?: { b64_json?: string }[] }
    const b64 = editData?.data?.[0]?.b64_json
    if (!b64) throw new Error("No image data in response")
    imageBuffer = Buffer.from(b64, "base64")
  } else {
    // Standard text-to-image generation (AI face or no face)
    const dalleRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1.5",
        prompt: imagePrompt,
        n: 1,
        size: input.apiSize,
        quality: "low",
      }),
    })

    if (!dalleRes.ok) {
      throw new Error(`GPT-Image-1.5 error ${dalleRes.status}: ${await dalleRes.text()}`)
    }

    const dalleData = await dalleRes.json() as { data?: { b64_json?: string }[] }
    const b64 = dalleData?.data?.[0]?.b64_json
    if (!b64) throw new Error("No image data in response")
    imageBuffer = Buffer.from(b64, "base64")
  }

  // Upload to R2
  const key = `thumbnails/${context.userId}/${Date.now()}.png`
  const permanentUrl = await uploadToR2(imageBuffer, key)

  // Deduct AFTER successful upload — architecture rule
  const { newBalance } = await CreditService.deductCredits(
    context.userId,
    creditCost,
    context.toolSlug
  )
  await invalidateBalance(context.userId)

  await ToolOutput.create({
    userId: context.userId,
    toolSlug: context.toolSlug,
    inputSnapshot: input,
    outputText: permanentUrl,
    creditsUsed: creditCost,
  })

  return {
    output: permanentUrl,
    structured: { imageUrl: permanentUrl },
    creditsUsed: creditCost,
    newBalance,
  }
}
