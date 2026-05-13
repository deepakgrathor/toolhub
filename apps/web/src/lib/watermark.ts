const TEXT_WATERMARK = "\n\n---\nGenerated with SetuLix — setulix.com";

const HTML_WATERMARK = `<div style="text-align:center;padding:12px 16px;font-size:12px;color:#888888;border-top:1px solid #e5e5e5;margin-top:24px;font-family:Inter,sans-serif;">Generated with <a href="https://setulix.com" style="color:#7c3aed;text-decoration:none;">SetuLix</a> — AI Workspace for Business</div>`;

export function applyWatermark(
  output: string,
  planSlug: string,
  toolSlug: string
): string {
  if (planSlug !== "free") return output;
  if (toolSlug === "thumbnail-ai") return output;

  const isHTML =
    output.trim().startsWith("<") || toolSlug === "website-generator";

  if (isHTML) {
    if (output.includes("</body>")) {
      return output.replace("</body>", HTML_WATERMARK + "</body>");
    }
    return output + HTML_WATERMARK;
  }

  return output + TEXT_WATERMARK;
}
