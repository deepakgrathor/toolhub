import { connectDB } from "@toolhub/db";
import { Tool, ITool } from "@toolhub/db";
import { ToolConfig, IToolConfig } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";

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

// ── Redis-first cache with in-memory fallback ───────────────────────────────

const CACHE_TTL_S = 5 * 60; // 5 minutes (Redis)
const MEM_TTL_MS = 5 * 60 * 1000; // 5 minutes (fallback)

interface MemEntry<T> { data: T; expiresAt: number; }
const memCache = new Map<string, MemEntry<unknown>>();

function memGet<T>(key: string): T | null {
  const e = memCache.get(key) as MemEntry<T> | undefined;
  if (!e) return null;
  if (Date.now() > e.expiresAt) { memCache.delete(key); return null; }
  return e.data;
}

function memSet<T>(key: string, data: T): void {
  memCache.set(key, { data, expiresAt: Date.now() + MEM_TTL_MS });
}

async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    const data = await redis.get<T>(`registry:${key}`);
    return data ?? null;
  } catch {
    return memGet<T>(key);
  }
}

async function cacheSet<T>(key: string, data: T): Promise<void> {
  try {
    const redis = getRedis();
    await redis.set(`registry:${key}`, data, { ex: CACHE_TTL_S });
  } catch {
    memSet(key, data);
  }
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

/** Returns all active tools with their configs. Results cached 5 min in Redis (mem fallback). */
export async function getAllTools(): Promise<ToolWithConfig[]> {
  const cached = await cacheGet<ToolWithConfig[]>("all_tools");
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

  await cacheSet("all_tools", result);
  return result;
}

/** Returns a single tool with its config by slug. */
export async function getToolBySlug(slug: string): Promise<ToolWithConfig | null> {
  const cacheKey = `tool:${slug}`;
  const cached = await cacheGet<ToolWithConfig>(cacheKey);
  if (cached) return cached;

  await connectDB();

  const [tool, config] = await Promise.all([
    Tool.findOne({ slug }).lean<ITool>(),
    ToolConfig.findOne({ toolSlug: slug }).lean<IToolConfig>(),
  ]);

  if (!tool) return null;

  const result = mergeToolWithConfig(tool, config);
  await cacheSet(cacheKey, result);
  return result;
}

/** Returns all active tools belonging to a specific kit. */
export async function getToolsByKit(kit: string): Promise<ToolWithConfig[]> {
  const cacheKey = `kit:${kit}`;
  const cached = await cacheGet<ToolWithConfig[]>(cacheKey);
  if (cached) return cached;

  const all = await getAllTools();
  const result = all.filter((t) => t.kits.includes(kit));
  await cacheSet(cacheKey, result);
  return result;
}

/** Returns all unique kits with their active tool counts. */
export async function getKitList(): Promise<KitInfo[]> {
  const cached = await cacheGet<KitInfo[]>("kit_list");
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

  await cacheSet("kit_list", result);
  return result;
}

/** Clears the cache (Redis + in-memory fallback). Called after admin edits. */
export async function clearToolCache(): Promise<void> {
  memCache.clear();
  try {
    const redis = getRedis();
    const keys = await redis.keys("registry:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Redis not configured — in-memory already cleared above
  }
}
