import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import type { ThumbnailAIInput } from "./schema";

const STYLE_LABELS: Record<string, string> = {
  "youtube-thumbnail": "YouTube thumbnail",
  "instagram-post": "Instagram post",
  "linkedin-banner": "LinkedIn banner",
  "blog-header": "blog header image",
};

function buildDallEPrompt(input: ThumbnailAIInput): string {
  const textNote = input.textOverlay
    ? `Include bold, readable text overlay: "${input.textOverlay}".`
    : "No text overlay.";
  return `Create a professional ${STYLE_LABELS[input.style]} for "${input.videoTitle}". ${input.colorScheme} color scheme, highly eye-catching. Main visual: ${input.mainSubject}. ${textNote} 16:9 aspect ratio, high resolution, suitable for ${input.style === "youtube-thumbnail" ? "YouTube" : "social media"}.`;
}

async function downloadImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf);
}

async function uploadToR2(buffer: Buffer, key: string): Promise<string> {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error("Image storage not configured. Contact support.");
  }

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: "image/png",
    })
  );

  return `${publicUrl.replace(/\/$/, "")}/${key}`;
}

export async function execute(
  input: ThumbnailAIInput,
  context: ToolEngineContext
): Promise<ToolEngineResult> {
  await connectDB();

  const toolConfigDoc = await ToolConfig.findOne({ toolSlug: context.toolSlug })
    .select("creditCost")
    .lean();
  const creditCost = toolConfigDoc?.creditCost ?? 7;

  // Fail fast if R2 not configured
  if (
    !process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
    !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    !process.env.CLOUDFLARE_R2_BUCKET_NAME ||
    !process.env.CLOUDFLARE_R2_PUBLIC_URL
  ) {
    throw new Error("Image storage not configured. Contact support.");
  }

  const openAIKey = process.env.OPENAI_API_KEY;
  if (!openAIKey) throw new Error("OpenAI API key not configured.");

  const hasBalance = await CreditService.checkBalance(context.userId, creditCost);
  if (!hasBalance) {
    const balance = await CreditService.getBalance(context.userId);
    throw new InsufficientCreditsError(balance, creditCost);
  }

  const prompt = buildDallEPrompt(input);

  const dalleRes = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
    }),
  });

  if (!dalleRes.ok) {
    throw new Error(`DALL-E error ${dalleRes.status}: ${await dalleRes.text()}`);
  }

  const dalleData = await dalleRes.json() as { data?: { url?: string }[] };
  const tempUrl = dalleData?.data?.[0]?.url;
  if (!tempUrl) throw new Error("No image URL in DALL-E response");

  const imageBuffer = await downloadImageBuffer(tempUrl);

  const key = `thumbnails/${context.userId}/${Date.now()}.png`;
  const permanentUrl = await uploadToR2(imageBuffer, key);

  // Deduct AFTER successful R2 upload
  const { newBalance } = await CreditService.deductCredits(
    context.userId,
    creditCost,
    context.toolSlug
  );

  await ToolOutput.create({
    userId: context.userId,
    toolSlug: context.toolSlug,
    inputSnapshot: input,
    outputText: permanentUrl,
    creditsUsed: creditCost,
  });

  const structured = { imageUrl: permanentUrl };
  return { output: permanentUrl, structured, creditsUsed: creditCost, newBalance };
}
