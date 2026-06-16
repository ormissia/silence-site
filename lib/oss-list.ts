import fs from "node:fs";
import path from "node:path";
import { mapWithConcurrency, withRetry } from "./concurrency";

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

/** ListObjects 比 image/info 更重，并发开小一点 */
const LIST_CONCURRENCY = 6;

const MANIFEST_PATH = path.join(process.cwd(), "content/.album-manifest.json");

/** prefix(不含尾斜杠) → 该文件夹下全部图片完整 key(含扩展名) */
export type Manifest = Record<string, string[]>;

/** 列举时只保留这些图片扩展名 */
const IMG_EXT = /\.(jpe?g|png|webp|avif|gif|tiff?)$/i;

/** demo 模式(无 OSS base)无法列举时,每个文件夹回退的占位张数 */
const DEFAULT_FALLBACK_COUNT = 6;

function readOssBase(): string {
  const raw = process.env.NEXT_PUBLIC_OSS_BASE_URL?.trim();
  if (!raw) return "";
  // 占位字面量（来自 .env.example）当作未配置处理
  if (raw.includes("<") || raw.includes(">")) return "";
  if (!/^https?:\/\//.test(raw)) return "";
  return raw.replace(/\/$/, "");
}

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
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const k = /<Key>([\s\S]*?)<\/Key>/.exec(m[1]);
    if (k) out.push(decodeXml(k[1].trim()));
  }
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
  let token: string | undefined;

  do {
    const u = new URL(base);
    u.searchParams.set("list-type", "2");
    u.searchParams.set("prefix", norm);
    u.searchParams.set("delimiter", "/");
    u.searchParams.set("max-keys", "1000");
    if (token) u.searchParams.set("continuation-token", token);

    const res = await fetch(u.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`list ${norm} -> HTTP ${res.status}`);
    const xml = await res.text();

    for (const k of extractKeys(xml)) {
      if (k === norm) continue; // 目录占位对象
      if (k.endsWith("/")) continue; // 子目录
      if (!IMG_EXT.test(k)) continue; // 非图片
      keys.push(k);
    }
    token = isTruncated(xml) ? nextToken(xml) : undefined;
  } while (token);

  return keys;
}

// ---- manifest 缓存 --------------------------------------------------------

function loadManifest(): Manifest {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
  } catch {
    return {};
  }
}

function writeManifest(map: Manifest): void {
  try {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(map, null, 2), "utf8");
  } catch (err) {
    console.warn("[album-manifest] failed to persist cache:", err);
  }
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
 * - 真实模式:读缓存,miss 的 prefix 并发列举。
 *   - 列举成功(哪怕 0 张)→ 如实缓存,空文件夹就是空,绝不造假占位
 *     （真实模式下假占位 key 会直接 404）。
 *   - 列举失败(网络/HTTP 错误)→ 不缓存、本次按空处理,留待下次构建重试。
 */
export async function ensureManifest(requests: ListRequest[]): Promise<Manifest> {
  const base = readOssBase();

  if (!base) {
    return Object.fromEntries(
      requests.map((r) => [r.prefix, fallbackKeys(r.prefix, DEFAULT_FALLBACK_COUNT)])
    );
  }

  const cache = loadManifest();
  const missing = requests.filter((r) => !cache[r.prefix]);
  if (missing.length === 0) return cache;

  console.log(`[album-manifest] listing ${missing.length} folder(s) from OSS...`);
  const results = await mapWithConcurrency(missing, LIST_CONCURRENCY, async (r) => {
    try {
      const files = await withRetry(() => listAlbumFiles(r.prefix));
      return { prefix: r.prefix, files, ok: true };
    } catch (err) {
      console.warn(`[album-manifest] ${r.prefix} list failed (will retry next build):`, err);
      return { prefix: r.prefix, files: [] as string[], ok: false };
    }
  });

  let changed = false;
  for (const r of results) {
    if (r.ok) {
      cache[r.prefix] = r.files; // 成功(含空数组)才落缓存
      changed = true;
    }
  }
  if (changed) writeManifest(cache);

  // 失败的 prefix 不入缓存,下游 `manifest[prefix] ?? []` 兜成空,下次构建重试
  return cache;
}
