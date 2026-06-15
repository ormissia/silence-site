import { readAllWorksMdx, type WorkRaw } from "./mdx";
import { ensureMeta } from "./image-meta";
import { ensureManifest, type Manifest } from "./oss-list";
import { CATEGORIES, TAB_SLUGS, type Category } from "./categories";

/**
 * 子目录名（如 "landscape"）→ 中文 series（"风光"）。
 * MDX 按 category 分目录后，frontmatter 缺 series 时按目录兜底。
 */
function seriesFromPath(pathSegments: string[]): Category | undefined {
  const seg = pathSegments[0];
  if (!seg) return undefined;
  return (TAB_SLUGS as Record<string, Category>)[seg];
}

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
 * album 字段 → OSS 完整 prefix。
 * 规则:含 `/` 视为完整相对 prefix（如胶片 `film/0001-120-RVP100-3`）,
 * 否则补 `albums/` 前缀（如普通作品 `bzlyuj` → `albums/bzlyuj`）。
 */
function albumPrefix(album: string): string {
  return album.includes("/") ? album.replace(/\/$/, "") : `albums/${album}`;
}

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

/** works 单一来源（含 film 子目录） */
function readAllSources(): WorkRaw[] {
  return readAllWorksMdx();
}

/** 把单条 MDX 原始数据 + 列举 manifest 映射成 Work（纯同步） */
function mapRawToWork(raw: WorkRaw, manifest: Manifest): Work {
  const { slug, pathSegments, data, storyMd } = raw;
  const album = typeof data.album === "string" ? data.album : undefined;
  const explicitCover = typeof data.cover === "string" ? data.cover : undefined;
  const explicitPhotos = Array.isArray(data.photos)
    ? (data.photos as Photo[])
    : undefined;

  let cover = explicitCover ?? "";
  let photos: Photo[] = explicitPhotos ?? [];

  if (album && !explicitPhotos) {
    const prefix = albumPrefix(album);
    const files = manifest[prefix] ?? [];
    ({ cover, photos } = resolveCoverAndPhotos(prefix, files, explicitCover));
  }

  // series：frontmatter 优先，否则按子目录名兜底（landscape → 风光）
  const series =
    typeof data.series === "string" && data.series.length > 0
      ? data.series
      : (seriesFromPath(pathSegments) ?? "");

  return {
    slug,
    title: data.title as string,
    series,
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
}

/**
 * 进程级懒加载：第一次调用时读 MDX、列举 OSS 文件夹拿真实文件名、
 * 批量探测尺寸、注入到 cover/photos[].width/height；之后所有 list/get
 * 调用都共用这一份内存结果。
 *
 * 用 Promise 缓存而不是 await 完成后存数组——并发场景下避免重复列举/探测。
 */
let cachePromise: Promise<Work[]> | null = null;

function ensureLoaded(): Promise<Work[]> {
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    const raws = readAllSources();

    // 1) 收集所有需要列举的 album prefix
    const listReqs = raws
      .filter((r) => typeof r.data.album === "string" && !Array.isArray(r.data.photos))
      .map((r) => ({ prefix: albumPrefix(r.data.album as string) }));
    const manifest = await ensureManifest(listReqs);

    // 2) 映射成 Work,过滤空相册(未上传/列举失败 → 无图,避免 404),按 date 倒序
    const works = raws
      .map((r) => mapRawToWork(r, manifest))
      .filter((w) => w.photos.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date));

    // 3) 收集全部 OSS key 探测尺寸,注入 width/height
    const allKeys = Array.from(
      new Set(works.flatMap((w) => [w.cover, ...w.photos.map((p) => p.key)]))
    ).filter(
      // 外链与本地 public/ 资源跳过探测,只对 OSS key 探测
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
  const all = await ensureLoaded();
  return all.find((c) => c.slug === slug);
}

/** 站点内置的三大分类，顺序即菜单顺序 */
export { CATEGORIES, TAB_SLUGS, tabToSeries, seriesToTab } from "./categories";
export type { Category, TabSlug } from "./categories";
