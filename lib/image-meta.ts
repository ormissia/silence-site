import fs from "node:fs";
import path from "node:path";

/**
 * 图片真实尺寸的探测 + 持久化缓存。
 *
 * 思路：每张作品图都按 OSS key 索引；首次构建/SSR 时调用阿里云
 * `?x-oss-process=image/info` 拿到真实 width/height，写到
 * `content/.image-meta.json` 缓存（不入 git）。后续直接读 cache，
 * 让 Justified Layout 在 RSC 阶段就拿到比例，零 CLS、零手填。
 */

export type Dim = { w: number; h: number };
export type MetaMap = Record<string, Dim>;

const CACHE_PATH = path.join(process.cwd(), "content/.image-meta.json");

function readOssBase(): string {
  const raw = process.env.NEXT_PUBLIC_OSS_BASE_URL?.trim();
  if (!raw) return "";
  if (raw.includes("<") || raw.includes(">")) return "";
  if (!/^https?:\/\//.test(raw)) return "";
  return raw.replace(/\/$/, "");
}

function loadCache(): MetaMap {
  try {
    const raw = fs.readFileSync(CACHE_PATH, "utf8");
    return JSON.parse(raw) as MetaMap;
  } catch {
    return {};
  }
}

function writeCache(map: MetaMap): void {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(map, null, 2), "utf8");
  } catch (err) {
    // cache 写不进去不阻断渲染，给一行警告就好
    console.warn("[image-meta] failed to persist cache:", err);
  }
}

/**
 * 调 OSS 的 image/info 接口拿尺寸。失败抛错由上层兜底。
 * 返回示例：{ ImageWidth: { value: "4284" }, ImageHeight: { value: "5712" } }
 */
async function probeOss(key: string, ossBase: string): Promise<Dim> {
  const url = `${ossBase}/${key}.jpg?x-oss-process=image/info`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`probe ${key} -> HTTP ${res.status}`);
  const json = (await res.json()) as Record<string, { value: string }>;
  const w = Number(json.ImageWidth?.value);
  const h = Number(json.ImageHeight?.value);
  if (!w || !h) throw new Error(`probe ${key} -> empty dims`);
  return { w, h };
}

/** demo 模式（OSS_BASE 缺失）的兜底：picsum 输出固定尺寸的占位图 */
const PICSUM_FALLBACK: Dim = { w: 1600, h: 1067 };

/**
 * 给定一组 OSS key，确保每个 key 在 cache 里有尺寸；
 * miss 的并发探测后写回 cache。返回 key → {w,h} 的查询表。
 *
 * - demo 模式（无 OSS base）：跳过探测，全部回落到 picsum 默认尺寸
 * - 探测失败的 key：单条静默 fallback，不污染整批结果
 */
export async function ensureMeta(keys: string[]): Promise<MetaMap> {
  const ossBase = readOssBase();
  if (!ossBase) {
    return Object.fromEntries(keys.map((k) => [k, PICSUM_FALLBACK]));
  }

  const cache = loadCache();
  const missing = keys.filter((k) => !cache[k]);

  if (missing.length === 0) return cache;

  console.log(`[image-meta] probing ${missing.length} image(s) from OSS...`);
  const results = await Promise.all(
    missing.map(async (key) => {
      try {
        return [key, await probeOss(key, ossBase)] as const;
      } catch (err) {
        console.warn(`[image-meta] ${key} probe failed, fallback used:`, err);
        return [key, PICSUM_FALLBACK] as const;
      }
    })
  );

  for (const [key, dim] of results) cache[key] = dim;
  writeCache(cache);
  return cache;
}
