import { z } from "zod";

export const thumbnailAISchema = z.object({
  videoTitle: z.string().min(3).max(200),
  style: z.enum(["youtube-thumbnail", "instagram-post", "linkedin-banner", "blog-header"]),
  colorScheme: z.enum(["vibrant", "dark", "minimal", "colorful"]),
  mainSubject: z.string().min(5).max(200),
  textOverlay: z.string().max(50).optional(),
});

export type ThumbnailAIInput = z.infer<typeof thumbnailAISchema>;
