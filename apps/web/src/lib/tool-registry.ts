import { connectDB } from "@toolhub/db";
import { Tool } from "@toolhub/db";
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
    isVisible: boolean;
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

// ── Aggregation helpers ─────────────────────────────────────────────────────

// Raw document shape returned by the $lookup pipeline
interface RawAggregatedTool {
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
  config?: {
    creditCost?: number;
    isActive?: boolean;
    isVisible?: boolean;
    aiModel?: string;
    aiProvider?: string;
    fallbackModel?: string;
    fallbackProvider?: string;
  };
}

// Reused pipeline stages — $match is prepended when querying by slug
const LOOKUP_STAGES = [
  {
    $lookup: {
      from: "toolconfigs",
      localField: "slug",
      foreignField: "toolSlug",
      as: "configArr",
    },
  },
  {
    $addFields: {
      config: { $arrayElemAt: ["$configArr", 0] },
    },
  },
  {
    $project: { configArr: 0 },
  },
];

function fromAggregated(raw: RawAggregatedTool): ToolWithConfig {
  const c = raw.config;
  return {
    slug: raw.slug,
    name: raw.name,
    description: raw.description,
    category: raw.category,
    kits: raw.kits,
    isAI: raw.isAI,
    isFree: raw.isFree,
    icon: raw.icon,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    config: {
      creditCost: c?.creditCost ?? 0,
      isActive: c?.isActive ?? true,
      isVisible: c?.isVisible ?? true,
      aiModel: c?.aiModel ?? "",
      aiProvider: c?.aiProvider ?? "",
      fallbackModel: c?.fallbackModel ?? "",
      fallbackProvider: c?.fallbackProvider ?? "",
    },
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Returns all active tools with their configs. Results cached 5 min in Redis (mem fallback). */
export async function getAllTools(): Promise<ToolWithConfig[]> {
  const cached = await cacheGet<ToolWithConfig[]>("all_tools");
  if (cached) return cached;

  await connectDB();

  const raws = await Tool.aggregate<RawAggregatedTool>(LOOKUP_STAGES);
  const result = raws
    .map(fromAggregated)
    .filter((t) => t.config.isActive && t.config.isVisible);

  await cacheSet("all_tools", result);
  return result;
}

/** Returns a single tool with its config by slug. */
export async function getToolBySlug(slug: string): Promise<ToolWithConfig | null> {
  const cacheKey = `tool:${slug}`;
  const cached = await cacheGet<ToolWithConfig>(cacheKey);
  if (cached) return cached;

  await connectDB();

  const raws = await Tool.aggregate<RawAggregatedTool>([
    { $match: { slug } },
    ...LOOKUP_STAGES,
  ]);

  if (!raws[0]) return null;

  const result = fromAggregated(raws[0]);
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
