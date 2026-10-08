import "server-only";

import path from "node:path";
import { mapWithConcurrency, withRetry } from "./concurrency";
import { readOssBase } from "./oss-config";
import { buildOssObjectUrl } from "./oss-url";
import { assertCanPrepareResources, canPrepareResources, isCurrentResourceBuild, readResourceCache, writeResourceCache, withResourceLock, resourceFetchOptions, OssHttpError } from "./oss-cache";

const PROBE_CONCURRENCY = 4;
const CACHE_PATH = path.join(process.cwd(), "content/.image-meta.json");

export type Dim = { w: number; h: number };
export type MetaMap = Record<string, Dim>;

function validDim(value: unknown): value is Dim {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const dimension = value as Partial<Dim>;
  return typeof dimension.w === "number" && Number.isSafeInteger(dimension.w) && dimension.w > 0 &&
    typeof dimension.h === "number" && Number.isSafeInteger(dimension.h) && dimension.h > 0;
}

async function probeOss(key: string, base: string): Promise<Dim> {
  const res = await fetch(`${buildOssObjectUrl(base, key)}?x-oss-process=image/info`, resourceFetchOptions());
  if (!res.ok) throw new OssHttpError(`probe ${key}`, res.status);
  const json = (await res.json()) as Record<string, { value?: unknown }> | null;
  const dimension = { w: Number(json?.ImageWidth?.value), h: Number(json?.ImageHeight?.value) };
  if (!validDim(dimension)) throw new Error(`probe ${key}: invalid image dimensions`);
  return dimension;
}

/** 未配置 OSS 时维持现有演示尺寸，不请求也不写入真实资源清单。 */
const PICSUM_FALLBACK: Dim = { w: 1600, h: 1067 };

/** 严格只读：开发/构建阶段也只接受已有有效产物，不探测、不加锁、不写盘。 */
export async function readImageMeta(keys: string[]): Promise<MetaMap> {
  const uniqueKeys = Array.from(new Set(keys));
  if (!uniqueKeys.length) return {};
  const base = readOssBase();
  if (!base) return Object.fromEntries(uniqueKeys.map((key) => [key, PICSUM_FALLBACK]));

  const cache = readResourceCache(CACHE_PATH, base, validDim);
  const missing = uniqueKeys.filter((key) => !cache.entries[key]);
  if (missing.length) throw new Error(`Required image dimensions missing: ${missing.join(", ")}; rebuild before deployment`);
  return Object.fromEntries(uniqueKeys.map((key) => [key, cache.entries[key]]));
}

/** 显式准备尺寸，仅构建/开发允许；每次生产构建重新探测。 */
export async function prepareImageMeta(keys: string[]): Promise<MetaMap> {
  assertCanPrepareResources();
  const uniqueKeys = Array.from(new Set(keys));
  if (!uniqueKeys.length) return {};
  const base = readOssBase();
  if (!base) return Object.fromEntries(uniqueKeys.map((key) => [key, PICSUM_FALLBACK]));

  return withResourceLock(CACHE_PATH, async () => {
    const cache = readResourceCache(CACHE_PATH, base, validDim, "prepare");
    const missing = uniqueKeys.filter((key) => !cache.entries[key]);
    let changed = !isCurrentResourceBuild(cache);
    const unavailable: string[] = [];
    if (missing.length) {
      console.log(`[image-meta] probing ${missing.length}/${uniqueKeys.length} images`);
      await mapWithConcurrency(missing, PROBE_CONCURRENCY, async (key) => {
        if (unavailable.length) return;
        try {
          cache.entries[key] = await withRetry(() => probeOss(key, base));
          changed = true;
        } catch (error) {
          unavailable.push(key);
          console.warn(`[image-meta] ${key}: probing failed`, error);
        }
      });
    }
    if (changed) writeResourceCache(CACHE_PATH, cache);
    if (unavailable.length) throw new Error(`Unable to prepare image dimensions: ${unavailable.join(", ")}`);
    return Object.fromEntries(uniqueKeys.map((key) => [key, cache.entries[key]]));
  });
}

/** 兼容旧调用方；新组合边界应显式选择 prepareImageMeta / readImageMeta。 */
export async function ensureMeta(keys: string[]): Promise<MetaMap> {
  return canPrepareResources() ? prepareImageMeta(keys) : readImageMeta(keys);
}
