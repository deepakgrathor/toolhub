import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db"
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared"
import { invalidateBalance } from "@/lib/credit-cache"
import { getSiteConfigValue } from "@/lib/site-config-cache"
import type { ThumbnailAIInput } from "./schema"

// ── Haiku system prompt ────────────────────────────────────────────────────

const HAIKU_SYSTEM_PROMPT = `You are an expert thumbnail designer who creates viral, high-CTR visual content for Indian creators and businesses.

Given content details, generate ONE detailed image generation prompt for GPT-Image-1.

OUTPUT RULES:
— Return ONLY the image prompt. Nothing else. No explanation, no preamble, no quotes.
— Length: 80-120 words. Specific and visual.
— Always include: composition, lighting, colors, main subject, mood, text area placement.
— NEVER include text/words in the image itself.
— NEVER include: real celebrity faces, brand logos, copyrighted characters, watermarks.
— Always reserve a clear area for text overlay (specify: bottom-third, top area, etc.)

COMPOSITION BY RATIO:
16:9 (YouTube/Blog/LinkedIn/Twitter): Wide horizontal, elements spread left-right, subject on right or center
9:16 (Reels/Pinterest): Tall vertical, bold center subject, text space at top or bottom
1:1 (Instagram Post): Centered square, balanced all sides, bold single subject

FACE INSTRUCTIONS:
AI Face Male: Indian male, appropriate age for niche, expression matching mood, photorealistic
AI Face Female: Indian female, appropriate age for niche, expression matching mood, photorealistic
No Face: Focus on objects, icons, environments — no human subjects

NICHE COLOR PALETTES:
Finance & Business: Dark navy/charcoal background, gold/blue accents, professional dramatic lighting
Tech & Gadgets: Dark background, neon green/blue/purple accents, dramatic backlight glow
Education: Clean white/light background, organized elements, warm soft lighting
Health & Fitness: Vibrant background, energetic composition, bright natural lighting
Lifestyle & Vlog: Warm golden tones, natural lighting, aspirational feel
Gaming: Dark dramatic background, neon accents, intense atmospheric lighting
Cooking & Food: Rich warm tones, appetizing lighting, close-up food photography style
Motivation: High contrast, dramatic spotlight, bold single color background
Travel: Vibrant outdoor colors, natural lighting, wide scenic composition
News & Current Affairs: Bold red/black/white, urgent composition, editorial style

MOOD TO VISUAL:
Urgency/Warning: Red accents, worried/shocked expression, warning visual elements, high contrast
Curiosity/Mystery: Partially hidden elements, raised eyebrow expression, dramatic shadow play
Excitement/Hype: Bright saturated colors, big smile/open mouth expression, dynamic diagonal composition
Shock/Surprise: Wide eyes expression, dramatic contrast, unexpected visual juxtaposition
Professional/Trust: Clean layout, confident expression, corporate color scheme, minimal clutter
Fun/Humor: Bright colors, exaggerated expression, playful elements, warm tones
Motivational: Dramatic spotlight, determined expression, bold empowering composition`

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

Generate the image prompt now.`
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

  // Stage 2: GPT-Image-1 generation
  let imageBuffer: Buffer

  if (input.faceMode === "own" && input.faceImageBase64) {
    // Image edit mode — user's face as reference
    const formData = new FormData()
    const faceBuffer = Buffer.from(input.faceImageBase64, "base64")
    const faceBlob = new Blob([faceBuffer], { type: "image/png" })
    formData.append("image", faceBlob, "face.png")
    formData.append("prompt", imagePrompt)
    formData.append("model", "gpt-image-1")
    formData.append("size", input.apiSize)
    formData.append("quality", "low")
    formData.append("n", "1")

    const editRes = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAIKey}` },
      body: formData,
    })

    if (!editRes.ok) {
      throw new Error(`GPT-Image-1 edit error ${editRes.status}: ${await editRes.text()}`)
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
        model: "gpt-image-1",
        prompt: imagePrompt,
        n: 1,
        size: input.apiSize,
        quality: "low",
      }),
    })

    if (!dalleRes.ok) {
      throw new Error(`GPT-Image-1 error ${dalleRes.status}: ${await dalleRes.text()}`)
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
