import { connectDB } from "@toolhub/db";
import { Tool, ITool } from "@toolhub/db";
import { ToolConfig, IToolConfig } from "@toolhub/db";

export interface ToolWithConfig {
  slug: string;
  name: string;
  description: string;
  category: string;
  kits: string[];
  isAI: boolean;
  isFree: boolean;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  config: {
    creditCost: number;
    isActive: boolean;
    aiModel: string;
    aiProvider: string;
    fallbackModel: string;
    fallbackProvider: string;
  };
}

export interface KitInfo {
  kit: string;
  toolCount: number;
}

// ── Simple in-memory cache (TTL: 5 min) ────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── DB helpers ──────────────────────────────────────────────────────────────

function mergeToolWithConfig(
  tool: ITool,
  config: IToolConfig | null
): ToolWithConfig {
  return {
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    kits: tool.kits,
    isAI: tool.isAI,
    isFree: tool.isFree,
    icon: tool.icon,
    createdAt: tool.createdAt,
    updatedAt: tool.updatedAt,
    config: {
      creditCost: config?.creditCost ?? 0,
      isActive: config?.isActive ?? true,
      aiModel: config?.aiModel ?? "",
      aiProvider: config?.aiProvider ?? "",
      fallbackModel: config?.fallbackModel ?? "",
      fallbackProvider: config?.fallbackProvider ?? "",
    },
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Returns all active tools with their configs. Results cached 5 min. */
export async function getAllTools(): Promise<ToolWithConfig[]> {
  const cached = cacheGet<ToolWithConfig[]>("all_tools");
  if (cached) return cached;

  await connectDB();

  const [tools, configs] = await Promise.all([
    Tool.find().lean<ITool[]>(),
    ToolConfig.find({ isActive: true }).lean<IToolConfig[]>(),
  ]);

  const configMap = new Map<string, IToolConfig>(
    configs.map((c) => [c.toolSlug, c])
  );

  const result = tools
    .map((t) => mergeToolWithConfig(t, configMap.get(t.slug) ?? null))
    .filter((t) => t.config.isActive);

  cacheSet("all_tools", result);
  return result;
}

/** Returns a single tool with its config by slug. */
export async function getToolBySlug(slug: string): Promise<ToolWithConfig | null> {
  const cacheKey = `tool:${slug}`;
  const cached = cacheGet<ToolWithConfig>(cacheKey);
  if (cached) return cached;

  await connectDB();

  const [tool, config] = await Promise.all([
    Tool.findOne({ slug }).lean<ITool>(),
    ToolConfig.findOne({ toolSlug: slug }).lean<IToolConfig>(),
  ]);

  if (!tool) return null;

  const result = mergeToolWithConfig(tool, config);
  cacheSet(cacheKey, result);
  return result;
}

/** Returns all active tools belonging to a specific kit. */
export async function getToolsByKit(kit: string): Promise<ToolWithConfig[]> {
  const cacheKey = `kit:${kit}`;
  const cached = cacheGet<ToolWithConfig[]>(cacheKey);
  if (cached) return cached;

  const all = await getAllTools();
  const result = all.filter((t) => t.kits.includes(kit));
  cacheSet(cacheKey, result);
  return result;
}

/** Returns all unique kits with their active tool counts. */
export async function getKitList(): Promise<KitInfo[]> {
  const cached = cacheGet<KitInfo[]>("kit_list");
  if (cached) return cached;

  const all = await getAllTools();

  const counts = new Map<string, number>();
  for (const tool of all) {
    for (const kit of tool.kits) {
      counts.set(kit, (counts.get(kit) ?? 0) + 1);
    }
  }

  const result: KitInfo[] = Array.from(counts.entries()).map(([kit, toolCount]) => ({
    kit,
    toolCount,
  }));

  cacheSet("kit_list", result);
  return result;
}

/** Clears the in-memory cache (useful after admin edits). */
export function clearToolCache(): void {
  cache.clear();
}
