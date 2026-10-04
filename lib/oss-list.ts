import "server-only";

import path from "node:path";
import { mapWithConcurrency, withRetry } from "./concurrency";
import { readOssBase } from "./oss-config";
import { canPrepareResources, readResourceCache, writeResourceCache, withResourceLock, resourceFetchOptions, OssHttpError } from "./oss-cache";

/**
 * 构建期 OSS 文件夹列举 + 持久化缓存。
 *
 * 背景:作品/胶片文件夹名固定,但文件夹内图片文件名不固定,无法靠
 * `1.jpg..N.jpg` 约定。改为构建期匿名调用阿里云 ListObjectsV2
 * （bucket 已加 Bucket Policy 放开匿名 oss:ListObjects）拿真实文件名,
 * 结果缓存到 `content/.album-manifest.json`（不入 git）。
 *
 * 与 image-meta.ts 同构:只在 server / RSC 构建阶段执行,运行时读缓存。
 */

/** 跨区域列举 OSS，限制同时建立的连接数 */
const LIST_CONCURRENCY = 2;

const MANIFEST_PATH = path.join(process.cwd(), "content/.album-manifest.json");

/** prefix(不含尾斜杠) → 该文件夹下全部图片完整 key(含扩展名) */
export type Manifest = Record<string, string[]>;

/** 列举时只保留这些图片扩展名 */
const IMG_EXT = /\.(jpe?g|png|webp|avif|gif|tiff?)$/i;

/** demo 模式(无 OSS base)无法列举时,每个文件夹回退的占位张数 */
const DEFAULT_FALLBACK_COUNT = 6;

// ---- XML 解析(无第三方依赖) ---------------------------------------------

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * 从 ListBucketResult XML 抽取所有对象 Key。
 * 先按 <Contents> 块界定再抽 <Key>,避免误抓 <CommonPrefixes><Prefix>。
 */
function extractKeys(xml: string): string[] {
  const out: string[] = [];
  const re = /<Contents\b[^>]*>([\s\S]*?)<\/Contents>/g;
  const openingCount = (xml.match(/<Contents\b[^>]*>/g) ?? []).length;
  let parsedCount = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    parsedCount++;
    const keys = Array.from(m[1].matchAll(/<Key>([\s\S]*?)<\/Key>/g));
    if (keys.length !== 1) throw new Error("Invalid OSS Contents: expected one complete Key");
    out.push(decodeXml(keys[0][1].trim()));
  }
  if (parsedCount !== openingCount || parsedCount !== (xml.match(/<\/Contents>/g) ?? []).length) throw new Error("Incomplete OSS Contents response");
  return out;
}

function isTruncated(xml: string): boolean {
  return /<IsTruncated>\s*true\s*<\/IsTruncated>/i.test(xml);
}

function nextToken(xml: string): string | undefined {
  const m = /<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/.exec(xml);
  return m ? decodeXml(m[1].trim()) : undefined;
}

// ---- 列举 -----------------------------------------------------------------

/**
 * 匿名 ListObjectsV2 列举某 prefix 下的图片文件,返回完整 key（含扩展名,
 * 如 "works/landscape/bzlyuj/cover.jpg"）。
 * - delimiter=/ 只列本层,不递归子目录
 * - 正确处理分页 (IsTruncated / NextContinuationToken)
 * - 过滤掉目录占位对象 / 子目录 / 非图片
 * demo 模式(无 OSS base)返回空数组,由上层回退。
 */
export async function listAlbumFiles(prefix: string): Promise<string[]> {
  const base = readOssBase();
  if (!base) return [];

  const norm = prefix.endsWith("/") ? prefix : prefix + "/";
  const keys: string[] = [];
  const seenTokens = new Set<string>();
  let token: string | undefined;

  do {
    const u = new URL(base);
    u.searchParams.set("list-type", "2");
    u.searchParams.set("prefix", norm);
    u.searchParams.set("delimiter", "/");
    u.searchParams.set("max-keys", "1000");
    if (token) u.searchParams.set("continuation-token", token);

    const res = await fetch(u.toString(), resourceFetchOptions());
    if (!res.ok) throw new OssHttpError(`list ${norm}`, res.status);
    const xml = await res.text();
    if (!/<ListBucketResult\b[^>]*>/.test(xml) || !/<\/ListBucketResult>/.test(xml) || !/<IsTruncated>\s*(true|false)\s*<\/IsTruncated>/.test(xml)) {
      throw new Error(`list ${norm}: invalid OSS listing response`);
    }

    for (const k of extractKeys(xml)) {
      if (!k.startsWith(norm) || k.slice(norm.length).includes("/")) continue;
      if (k === norm || k.endsWith("/")) continue;
      if (!IMG_EXT.test(k)) continue; // 非图片
      keys.push(k);
    }
    const next = isTruncated(xml) ? nextToken(xml) : undefined;
    if (isTruncated(xml) && (!next || seenTokens.has(next))) throw new Error(`list ${norm}: missing or repeated continuation token`);
    if (next) seenTokens.add(next);
    token = next;
  } while (token);

  return Array.from(new Set(keys));
}

// ---- manifest 缓存 --------------------------------------------------------

function validAlbum(value: unknown, prefix: string): value is string[] {
  const norm = `${prefix}/`;
  return Array.isArray(value) && value.every((key) =>
    typeof key === "string" && key.startsWith(norm) && !key.slice(norm.length).includes("/") && IMG_EXT.test(key)
  );
}

/** demo / 列举失败时的占位 key:prefix/1.jpg .. prefix/N.jpg */
function fallbackKeys(prefix: string, count: number): string[] {
  const n = Math.max(count, 1);
  return Array.from({ length: n }, (_, i) => `${prefix}/${i + 1}.jpg`);
}

export type ListRequest = { prefix: string };

/**
 * 批量确保每个 prefix 在 manifest 里有列举结果。
 *
 * - demo 模式（无 OSS base）:不发请求、不写盘,内存返回占位 key,
 *   让本地开发仍能用 picsum 出图,且不污染真实构建的缓存。
 * - 每次生产构建重新列举，构建 worker 共用本次结果；开发补齐缺失条目。
 * - 生产运行：严格只读；缺失条目抛错，不能发起请求或写入文件。
 * - 列举失败不把失败/部分响应当作空相册写入；缺失条目会阻止构建。
 */
export async function ensureManifest(requests: ListRequest[]): Promise<Manifest> {
  const base = readOssBase();
  const prefixes = Array.from(new Set(requests.map(({ prefix }) => prefix.replace(/\/$/, ""))));
  if (!prefixes.length) return {};
  if (!base) {
    return Object.fromEntries(prefixes.map((prefix) => [prefix, fallbackKeys(prefix, DEFAULT_FALLBACK_COUNT)]));
  }
  async function resolve(): Promise<Manifest> {
    const cache = readResourceCache(MANIFEST_PATH, base, validAlbum);
    const missing = prefixes.filter((prefix) => !cache.entries[prefix]);
    if (!canPrepareResources() && missing.length) throw new Error(`Required album manifest entries missing: ${missing.join(", ")}; rebuild before deployment`);
    const refresh = canPrepareResources() ? missing : [];
    if (refresh.length) {
      console.log(`[album-manifest] refreshing ${refresh.length}/${prefixes.length} albums`);
      let changed = false;
      const unavailable: string[] = [];
      await mapWithConcurrency(refresh, LIST_CONCURRENCY, async (prefix) => {
        if (unavailable.length) return;
        try {
          const files = await withRetry(() => listAlbumFiles(prefix));
          cache.entries[prefix] = files;
          changed = true;
        } catch (error) {
          unavailable.push(prefix);
          console.warn(`[album-manifest] ${prefix}: listing failed`, error);
        }
      });
      if (changed) writeResourceCache(MANIFEST_PATH, cache);
      if (unavailable.length) throw new Error(`Unable to prepare album manifest: ${unavailable.join(", ")}`);
    }
    return Object.fromEntries(prefixes.map((prefix) => [prefix, cache.entries[prefix]]));
  }
  return canPrepareResources() ? withResourceLock(MANIFEST_PATH, resolve) : resolve();
}
