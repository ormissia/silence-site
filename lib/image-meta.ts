import "server-only";

import path from "node:path";
import { mapWithConcurrency, withRetry } from "./concurrency";
import { readOssBase } from "./oss-config";
import { canPrepareResources, readResourceCache, writeResourceCache, withResourceLock, resourceFetchOptions, OssHttpError } from "./oss-cache";

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
  const res = await fetch(`${base}/${key}?x-oss-process=image/info`, resourceFetchOptions());
  if (!res.ok) throw new OssHttpError(`probe ${key}`, res.status);
  const json = (await res.json()) as Record<string, { value?: unknown }> | null;
  const dimension = { w: Number(json?.ImageWidth?.value), h: Number(json?.ImageHeight?.value) };
  if (!validDim(dimension)) throw new Error(`probe ${key}: invalid image dimensions`);
  return dimension;
}

/** 未配置 OSS 时维持现有演示尺寸，不请求也不写入真实资源清单。 */
const PICSUM_FALLBACK: Dim = { w: 1600, h: 1067 };

/** 每次构建重新探测；运行时只接受本次构建打包的有效尺寸。 */
export async function ensureMeta(keys: string[]): Promise<MetaMap> {
  const uniqueKeys = Array.from(new Set(keys));
  if (!uniqueKeys.length) return {};
  const base = readOssBase();
  if (!base) return Object.fromEntries(uniqueKeys.map((key) => [key, PICSUM_FALLBACK]));

  async function resolve(): Promise<MetaMap> {
    const cache = readResourceCache(CACHE_PATH, base, validDim);
    const missing = uniqueKeys.filter((key) => !cache.entries[key]);
    if (!canPrepareResources() && missing.length) throw new Error(`Required image dimensions missing: ${missing.join(", ")}; rebuild before deployment`);
    if (missing.length) {
      console.log(`[image-meta] probing ${missing.length}/${uniqueKeys.length} images`);
      let changed = false;
      const unavailable: string[] = [];
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
      if (changed) writeResourceCache(CACHE_PATH, cache);
      if (unavailable.length) throw new Error(`Unable to prepare image dimensions: ${unavailable.join(", ")}`);
    }
    return Object.fromEntries(uniqueKeys.map((key) => [key, cache.entries[key]]));
  }
  return canPrepareResources() ? withResourceLock(CACHE_PATH, resolve) : resolve();
}
