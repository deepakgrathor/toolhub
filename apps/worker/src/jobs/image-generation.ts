import type { Job } from "bullmq";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

interface ImageGenPayload {
  prompt: string;
  size: "1024x1024" | "1536x1024";
  userId: string;
  toolSlug: string;
}

export interface ImageGenResult {
  imageUrl: string;
}

function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function processImageGeneration(
  job: Job
): Promise<ImageGenResult> {
  const payload = job.data as ImageGenPayload;

  // 1. Generate image via LiteLLM gateway
  const genRes = await fetch(
    `${process.env.LITELLM_GATEWAY_URL}/images/generations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LITELLM_MASTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: payload.prompt,
        size: payload.size,
        quality: "low",
        n: 1,
      }),
    }
  );

  if (!genRes.ok) {
    const text = await genRes.text();
    throw new Error(`LiteLLM image error ${genRes.status}: ${text}`);
  }

  const genData = await genRes.json() as { data?: { b64_json?: string }[] };
  const b64 = genData?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data in response");

  const buffer = Buffer.from(b64, "base64");

  // 3. Upload to Cloudflare R2 for permanent storage
  const key = `images/${payload.toolSlug}/${payload.userId}/${Date.now()}.png`;

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: "image/png",
    })
  );

  const imageUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
  return { imageUrl };
}
