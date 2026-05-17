import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

function getSitesR2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_SITES_R2_ACCOUNT_ID;
  const accessKey = process.env.CLOUDFLARE_SITES_R2_ACCESS_KEY_ID;
  const secretKey = process.env.CLOUDFLARE_SITES_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKey || !secretKey) {
    throw new Error("Sites R2 credentials not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });
}

function getSitesBucket(): string {
  const bucket = process.env.CLOUDFLARE_SITES_R2_BUCKET_NAME;
  if (!bucket) throw new Error("CLOUDFLARE_SITES_R2_BUCKET_NAME not configured");
  return bucket;
}

export async function uploadSiteHtml(slug: string, html: string): Promise<string> {
  const client = getSitesR2Client();
  const bucket = getSitesBucket();
  const key = `sites/${slug}/index.html`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(html, "utf-8"),
      ContentType: "text/html; charset=utf-8",
    })
  );

  return `https://${slug}.setulix.site`;
}

export async function deleteSiteHtml(slug: string): Promise<void> {
  const client = getSitesR2Client();
  const bucket = getSitesBucket();
  const key = `sites/${slug}/index.html`;

  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err: unknown) {
    const code = (err as { Code?: string; name?: string }).Code ?? (err as { name?: string }).name;
    if (code === "NoSuchKey" || code === "NotFound") return;
    throw err;
  }
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  const client = getSitesR2Client();
  const bucket = getSitesBucket();
  const key = `sites/${slug}/index.html`;

  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return false; // exists — slug taken
  } catch (err: unknown) {
    const code = (err as { Code?: string; name?: string }).Code ?? (err as { name?: string }).name;
    if (code === "NotFound" || code === "NoSuchKey" || code === "404") return true;
    throw err;
  }
}
