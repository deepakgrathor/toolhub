import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, BusinessProfile } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { getUserPlan } from "@/lib/user-plan";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const planSlug = await getUserPlan(userId);

  if (planSlug === "free" || planSlug === "lite") {
    return NextResponse.json(
      { error: "pro_required", message: "Signature upload requires PRO plan" },
      { status: 403 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("signature") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.type !== "image/png") {
    return NextResponse.json(
      { error: "Only PNG files allowed (for transparent background)" },
      { status: 400 }
    );
  }

  if (file.size > 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large (max 1MB)" },
      { status: 400 }
    );
  }

  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL!;
  const key = `brand/${userId}/signature.png`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: "image/png",
    })
  );

  const signatureUrl = `${publicUrl.replace(/\/$/, "")}/${key}`;

  await connectDB();
  await BusinessProfile.findOneAndUpdate(
    { userId },
    { signatureUrl, userId },
    { upsert: true, new: true }
  );

  try {
    const redis = getRedis();
    await redis.del(`autofill:${userId}`);
  } catch {
    // silent
  }

  return NextResponse.json({ success: true, signatureUrl });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
  const client = getR2Client();

  try {
    await client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: `brand/${userId}/signature.png` })
    );
  } catch {
    // ignore — file may not exist
  }

  await connectDB();
  await BusinessProfile.findOneAndUpdate(
    { userId },
    { signatureUrl: null },
    { upsert: false }
  );

  try {
    const redis = getRedis();
    await redis.del(`autofill:${userId}`);
  } catch {
    // silent
  }

  return NextResponse.json({ success: true });
}
