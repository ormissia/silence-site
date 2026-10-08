import "server-only";

import { readAllWorksMdx } from "./mdx";
import { prepareImageMeta, readImageMeta } from "./image-meta";
import { prepareAlbumManifest, readAlbumManifest, type Manifest } from "./oss-list";
import { canPrepareResources } from "./oss-cache";
import { CATEGORIES } from "./categories";
import type { Work, WorkSummary, Photo } from "./works/types";
import type { ParsedWorkSource } from "./content/types";

export type { Work, WorkDetail, WorkSummary, Photo } from "./works/types";

/** 文件名自然排序:1.jpg < 2.jpg < 10.jpg；DSC001 < DSC010 */
function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/**
 * 基于 OSS 列举结果解析 cover / photos（纯函数,无副作用）。
 *
 * - files：manifest[prefix]，该文件夹下全部图片完整 key（含扩展名）
 * - explicitCover：frontmatter 的 cover 字段,值为文件名（如 "cover.jpg"）
 *
 * cover 既是封面也是详情页第一张：
 *   - 指定了 cover → 用 `${prefix}/${cover}`
 *   - 未指定 → 优先名为 cover.* 的文件,否则自然排序第一张
 * photos = cover 置顶 + 其余自然排序,去重（cover 不重复出现）。
 */
function resolveCoverAndPhotos(
  prefix: string,
  files: string[],
  explicitCover?: string
): { cover: string; photos: Photo[] } {
  const sorted = [...files].sort(naturalSort);

  let coverKey: string | undefined;
  if (explicitCover) {
    coverKey = `${prefix}/${explicitCover}`;
    if (!sorted.includes(coverKey)) {
      console.warn(`[works] cover "${explicitCover}" not found under ${prefix}`);
    }
  } else {
    coverKey = sorted.find((k) => /\/cover\.[^/]+$/i.test(k)) ?? sorted[0];
  }

  const ordered = coverKey
    ? [coverKey, ...sorted.filter((k) => k !== coverKey)]
    : sorted;

  return {
    cover: coverKey ?? "",
    photos: ordered.filter(Boolean).map((key) => ({ key })),
  };
}

/** 内容已经校验和归一化；这里只组装相册资源，不再解释 frontmatter。 */
function mapSourceToWork(source: ParsedWorkSource, manifest: Manifest): Work {
  const { metadata, albumPrefix, storyMd } = source;
  const assets = albumPrefix
    ? resolveCoverAndPhotos(albumPrefix, manifest[albumPrefix] ?? [], metadata.cover)
    : { cover: metadata.cover, photos: source.photos ?? [] };
  return {
    ...metadata,
    ...assets,
    story: storyMd
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean),
  } satisfies Work;
}

/**
 * 进程级懒加载：构建期准备相册和尺寸，生产运行只读打包的清单。
 * 成功后所有 list/get 共用结果；失败不缓存 rejected Promise。
 *
 * 用 Promise 缓存而不是 await 完成后存数组——并发场景下避免重复列举/探测。
 */
let cachePromise: Promise<Work[]> | null = null;
let bySlug = new Map<string, Work>();

function ensureLoaded(): Promise<Work[]> {
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    const sources = readAllWorksMdx();
    // Choose capabilities once at composition; queries do not implicitly repair runtime assets.
    const resources = canPrepareResources()
      ? { manifest: prepareAlbumManifest, dimensions: prepareImageMeta }
      : { manifest: readAlbumManifest, dimensions: readImageMeta };

    // 1) 收集所有需要列举的 album prefix
    const listReqs = sources.flatMap(({ albumPrefix }) => albumPrefix ? [{ prefix: albumPrefix }] : []);
    const manifest = await resources.manifest(listReqs);

    // 2) 成功列举的空相册不展示；网络失败已在资源层阻止加载。
    const mapped = sources.map((source) => mapSourceToWork(source, manifest));
    const excluded = mapped.filter((w) => w.photos.length === 0);
    for (const work of excluded) {
      console.warn(`[works] excluded ${work.slug}: no photos`);
    }
    const works = mapped
      .filter((w) => w.photos.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
    console.log(`[works] sources=${sources.length}, available=${works.length}, excluded=${excluded.length}`);

    // 3) 收集全部 OSS key 探测尺寸,注入 width/height
    const allKeys = Array.from(
      new Set(works.flatMap((w) => [w.cover, ...w.photos.map((p) => p.key)]))
    ).filter(
      // 外链与本地 public/ 资源跳过探测,只对 OSS key 探测
      (k) => k && !/^https?:\/\//.test(k) && !k.startsWith("/")
    );
    const meta = await resources.dimensions(allKeys);
    const result = works.map((w) => ({
      ...w,
      coverWidth: meta[w.cover]?.w,
      coverHeight: meta[w.cover]?.h,
      photos: w.photos.map((p) => ({
        ...p,
        width: p.width ?? meta[p.key]?.w,
        height: p.height ?? meta[p.key]?.h,
      })),
    }));
    bySlug = new Map(result.map((work) => [work.slug, work]));
    return result;
  })().catch((error) => {
    cachePromise = null;
    throw error;
  });
  return cachePromise;
}

export async function listWorks(): Promise<Work[]> {
  return ensureLoaded();
}

function toWorkSummary({ slug, title, series, date, location, cover, deck }: Work): WorkSummary {
  return { slug, title, series, date, location, cover, deck };
}

/** 列表不向客户端传递相册、故事和 EXIF。 */
export async function listWorkSummaries(): Promise<WorkSummary[]> {
  return (await ensureLoaded()).map(toWorkSummary);
}

/** 首页用：当前语义为"按 date 倒序前 5 条"——发新影集自动顶替 */
export async function listFeatured(): Promise<Work[]> {
  return (await ensureLoaded()).slice(0, 5);
}

/** 保留首页最新五个作品的顺序，只返回展示字段。 */
export async function listFeaturedSummaries(): Promise<WorkSummary[]> {
  return (await listFeatured()).map(toWorkSummary);
}

export async function listSeries(): Promise<string[]> {
  const all = await ensureLoaded();
  return Array.from(new Set(all.map((c) => c.series)));
}

/**
 * 二级页 tabs 计数：返回每个 series 对应的作品数（仅有作品的 series）。
 * 顺序与 lib/categories 的 CATEGORIES 一致；count=0 的 series 跳过，
 * 让 "人像" 在没作品时不出现在 tabs 上。
 */
export async function listWorksCategoryCounts(): Promise<
  Array<{ series: string; count: number }>
> {
  const all = await ensureLoaded();
  const counts = new Map<string, number>();
  for (const w of all) {
    counts.set(w.series, (counts.get(w.series) ?? 0) + 1);
  }
  return CATEGORIES.map((c) => ({ series: c, count: counts.get(c) ?? 0 })).filter(
    (x) => x.count > 0
  );
}

export async function getWork(slug: string): Promise<Work | undefined> {
  await ensureLoaded();
  return bySlug.get(slug);
}

/** 站点内置的三大分类，顺序即菜单顺序 */
export { CATEGORIES, TAB_SLUGS, tabToSeries, seriesToTab } from "./categories";
export type { Category, TabSlug } from "./categories";
