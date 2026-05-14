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
      { error: "pro_required", message: "Logo upload requires PRO plan" },
      { status: 403 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("logo") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PNG or JPG files allowed" },
      { status: 400 }
    );
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large (max 2MB)" },
      { status: 400 }
    );
  }

  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL!;
  const ext = file.type === "image/png" ? "png" : "jpg";
  const key = `brand/${userId}/logo.${ext}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  const logoUrl = `${publicUrl.replace(/\/$/, "")}/${key}`;

  await connectDB();
  await BusinessProfile.findOneAndUpdate(
    { userId },
    { logoUrl, userId },
    { upsert: true, new: true }
  );

  try {
    const redis = getRedis();
    await redis.del(`autofill:${userId}`);
  } catch {
    // silent
  }

  return NextResponse.json({ success: true, logoUrl });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
  const client = getR2Client();

  // Try deleting both extensions
  for (const ext of ["png", "jpg"]) {
    try {
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: `brand/${userId}/logo.${ext}` })
      );
    } catch {
      // ignore — file may not exist
    }
  }

  await connectDB();
  await BusinessProfile.findOneAndUpdate(
    { userId },
    { logoUrl: null },
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
