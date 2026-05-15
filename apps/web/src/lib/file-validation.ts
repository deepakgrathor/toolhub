import { Buffer } from "buffer";

const MAGIC_BYTES: Record<string, string> = {
  ffd8ff: "image/jpeg",     // JPEG
  "89504e47": "image/png",  // PNG
  "47494638": "image/gif",  // GIF
  "52494646": "image/webp", // WebP (RIFF header)
};

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

export async function validateImageFile(file: File): Promise<{
  valid: boolean;
  error?: string;
  detectedMime?: string;
}> {
  const MAX_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File size must be under 2MB" };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: "File type not allowed" };
  }

  const buffer = await file.arrayBuffer();
  const bytes = Buffer.from(buffer).slice(0, 8);
  const hex = bytes.toString("hex");

  const detectedMime = Object.entries(MAGIC_BYTES).find(
    ([magic]) => hex.startsWith(magic)
  )?.[1];

  if (!detectedMime) {
    return { valid: false, error: "Invalid image file" };
  }

  return { valid: true, detectedMime };
}

export async function validateSignatureFile(file: File): Promise<{
  valid: boolean;
  error?: string;
  detectedMime?: string;
}> {
  const MAX_SIZE = 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File size must be under 1MB" };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext !== "png") {
    return { valid: false, error: "Only PNG files allowed" };
  }

  const buffer = await file.arrayBuffer();
  const bytes = Buffer.from(buffer).slice(0, 8);
  const hex = bytes.toString("hex");

  if (!hex.startsWith("89504e47")) {
    return { valid: false, error: "Invalid PNG file" };
  }

  return { valid: true, detectedMime: "image/png" };
}
