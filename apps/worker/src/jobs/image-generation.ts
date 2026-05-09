import type { Job } from "bullmq";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

interface ImageGenPayload {
  prompt: string;
  size: "1024x1024" | "1792x1024";
  userId: string;
  toolSlug: string;
}

export interface ImageGenResult {
  imageUrl: string;
}

function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
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
        model: "dall-e-3",
        prompt: payload.prompt,
        size: payload.size,
        n: 1,
      }),
    }
  );

  if (!genRes.ok) {
    const text = await genRes.text();
    throw new Error(`LiteLLM image error ${genRes.status}: ${text}`);
  }

  const genData = await genRes.json();
  const openaiUrl = genData.data[0].url as string;

  // 2. Download image from OpenAI's expiring URL (valid ~1 hour)
  const imgRes = await fetch(openaiUrl);
  if (!imgRes.ok) {
    throw new Error(`Failed to download image: ${imgRes.status}`);
  }
  const buffer = Buffer.from(await imgRes.arrayBuffer());

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
