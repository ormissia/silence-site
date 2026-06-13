import { readAllWorksMdx } from "./mdx";
import { ensureMeta } from "./image-meta";

export type Photo = {
  key: string;
  caption?: string;
  /** OSS 探测得到的真实像素宽，Justified Layout 用于排版；缺失时下游回落 */
  width?: number;
  /** 同上 */
  height?: number;
};

export type Work = {
  slug: string;
  title: string;
  series: string;
  year: number;
  date: string;
  location: string;
  cover: string;
  /** cover 的真实像素宽，列表 Justified 排版需要 */
  coverWidth?: number;
  /** 同上 */
  coverHeight?: number;
  deck: string;
  story: string[];
  exif: { camera: string; lens: string; film?: string };
  photos: Photo[];
  featured?: boolean;
};

/** YAML 会把无引号 ISO 日期解析成 Date，统一归一为 yyyy-mm-dd 字符串 */
function normalizeDate(raw: unknown): string {
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  if (typeof raw === "string") return raw;
  return "";
}

/**
 * 约定式 cover / photos 解析。
 *
 * 标准写法（推荐）：
 *   album: bzlyuj
 *   photoCount: 12
 * 自动展开为：
 *   cover  = albums/bzlyuj/cover
 *   photos = [albums/bzlyuj/1 ... albums/bzlyuj/12]
 *
 * 也支持显式覆盖（用于单张作品 / 带 caption / 不在 albums/ 下的旧数据）：
 *   - 写了 `photos:` 数组 → 直接用，跳过自动展开
 *   - 写了 `cover:` 字段  → 覆盖自动生成的 cover
 *
 * 文件命名硬约定：照片名为整数序号（1.jpg, 2.jpg ... 10.jpg, 11.jpg），不补零。
 */
function resolveCoverAndPhotos(data: Record<string, unknown>): {
  cover: string;
  photos: Photo[];
} {
  const album = typeof data.album === "string" ? data.album : undefined;
  const photoCount =
    typeof data.photoCount === "number" ? data.photoCount : undefined;
  const explicitCover = typeof data.cover === "string" ? data.cover : undefined;
  const explicitPhotos = Array.isArray(data.photos)
    ? (data.photos as Photo[])
    : undefined;

  let cover = explicitCover ?? "";
  let photos: Photo[] = explicitPhotos ?? [];

  if (album) {
    if (!explicitCover) cover = `albums/${album}/cover`;
    if (!explicitPhotos && photoCount && photoCount > 0) {
      photos = Array.from({ length: photoCount }, (_, i) => ({
        key: `albums/${album}/${i + 1}`,
      }));
    }
  }

  return { cover, photos };
}

function buildWorksFromMdx(): Work[] {
  return readAllWorksMdx()
    .map(({ slug, data, storyMd }) => {
      const { cover, photos } = resolveCoverAndPhotos(data);
      return {
        slug,
        title: data.title as string,
        series: data.series as string,
        year: data.year as number,
        date: normalizeDate(data.date),
        location: data.location as string,
        cover,
        deck: data.deck as string,
        story: storyMd
          .split(/\n\n+/)
          .map((p) => p.trim())
          .filter(Boolean),
        exif: data.exif as Work["exif"],
        photos,
        featured: data.featured as boolean | undefined,
      } satisfies Work;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * 进程级懒加载：第一次调用时读 MDX、批量探测 OSS 尺寸、注入到 photos[].width/height；
 * 之后所有 list/get 调用都共用这一份内存结果。
 *
 * 这里用 Promise 缓存而不是 await 完成后存数组——并发场景下避免重复探测。
 */
let cachePromise: Promise<Work[]> | null = null;

function ensureLoaded(): Promise<Work[]> {
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    const works = buildWorksFromMdx();
    const allKeys = Array.from(
      new Set(works.flatMap((w) => [w.cover, ...w.photos.map((p) => p.key)]))
    ).filter(
      // 外链与本地 public/ 资源跳过探测，只对 OSS key 探测
      (k) => k && !/^https?:\/\//.test(k) && !k.startsWith("/")
    );
    const meta = await ensureMeta(allKeys);
    return works.map((w) => ({
      ...w,
      coverWidth: meta[w.cover]?.w,
      coverHeight: meta[w.cover]?.h,
      photos: w.photos.map((p) => ({
        ...p,
        width: p.width ?? meta[p.key]?.w,
        height: p.height ?? meta[p.key]?.h,
      })),
    }));
  })();
  return cachePromise;
}

export async function listWorks(): Promise<Work[]> {
  return ensureLoaded();
}

/** 首页用：当前语义为"按 date 倒序前 3 条"——发新影集自动顶替 */
export async function listFeatured(): Promise<Work[]> {
  return (await ensureLoaded()).slice(0, 3);
}

export async function listSeries(): Promise<string[]> {
  const all = await ensureLoaded();
  return Array.from(new Set(all.map((c) => c.series)));
}

export async function getWork(slug: string): Promise<Work | undefined> {
  const all = await ensureLoaded();
  return all.find((c) => c.slug === slug);
}

/** 站点内置的三大分类，顺序即菜单顺序 */
export { CATEGORIES, TAB_SLUGS, tabToSeries, seriesToTab } from "./categories";
export type { Category, TabSlug } from "./categories";
