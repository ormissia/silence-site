import "server-only";

import { readAllReadingMdx } from "./mdx";
import { renderMarkdown } from "./markdown";
import { splitReadingMarkdown } from "./reading-sections";
import { ensureString, ensureNumber, ensureStringArray, normalizeDateMaybe, resolveReadingSlug } from "./content/fields";
import type { ReadingEntry, ReadingMetadata, ReadingSummary, Highlight, HighlightBatch } from "./reading/types";

export type { ReadingEntry, ReadingDetail, ReadingMetadata, ReadingSummary, Highlight, HighlightBatch } from "./reading/types";

/** 不展示给读者的 meta tag——它们是导出工具的内部标记，跟读书内容无关 */
const HIDDEN_TAGS = new Set(["读书笔记"]);

/** "读完"的几种叫法，命中即视为已读完 */
const FINISHED_TAGS = new Set(["读完", "已读", "读毕", "看完"]);

/**
 * 加工 tags：
 * - 过滤 HIDDEN_TAGS（"读书笔记"等 meta 标签）
 * - 检测 FINISHED_TAGS（"读完"等），返回 isFinished 标志
 */
function processTags(raw: string[] | undefined): {
  visible: string[] | undefined;
  finished: boolean;
} {
  if (!raw) return { visible: undefined, finished: false };
  const finished = raw.some((t) => FINISHED_TAGS.has(t));
  const visible = raw.filter((t) => !HIDDEN_TAGS.has(t));
  return {
    visible: visible.length > 0 ? visible : undefined,
    finished,
  };
}

/**
 * 抽取一级分类。规则（按优先级）：
 * 1. frontmatter 的 `category` 字段，按空格分割取第一段
 *    例：`category: 哲学宗教 西方哲学` → "哲学宗教"
 * 2. fallback：文件相对 content/reading/ 的第一级目录名
 *    例：content/reading/哲学宗教/理想国.md → "哲学宗教"
 * 3. 都没有：返回 "未分类"
 */
function resolveCategory(
  pathSegments: string[],
  data: Record<string, unknown>
): string {
  const raw = ensureString(data.category);
  if (raw) {
    const first = raw.split(/\s+/)[0]?.trim();
    if (first) return first;
  }
  if (pathSegments.length > 0) return pathSegments[0];
  return "未分类";
}

// 同一份原文同时供元数据、详情和书摘使用。保持扫描顺序，避免改变书摘洗牌输入。
const SOURCES = readAllReadingMdx();
const RAW_BY_SLUG = new Map(SOURCES.map((raw) => [resolveReadingSlug(raw.fileName, raw.data), raw]));
const ALL: ReadingMetadata[] = SOURCES
  .map(({ fileName, pathSegments, data }) => {
    const { visible: visibleTags, finished } = processTags(
      ensureStringArray(data.tags)
    );
    const rawProgress = ensureString(data.progress);
    const rawReadProgress = ensureNumber(data.readProgress);
    return {
      // 用 fileName 当 fallback hash 的输入，但永远不直接当 URL slug
      slug: resolveReadingSlug(fileName, data),
      title: (data.title as string) ?? fileName,
      author: ensureString(data.author),
      cover: ensureString(data.cover),
      // 读完 → 强制 100%；否则用 frontmatter 原值
      progress: finished ? "100%" : rawProgress,
      rating: ensureString(data.rating),
      readProgress: finished ? 100 : rawReadProgress,
      readingTime: ensureString(data.readingTime),
      readingDate: ensureString(data.readingDate),
      lastReadDate: ensureString(data.lastReadDate),
      finishedDate: normalizeDateMaybe(data.finishedDate),
      category: resolveCategory(pathSegments, data),
      rawCategory: ensureString(data.category),
      tags: visibleTags,
      isbn: ensureString(data.isbn),
      totalWords: ensureNumber(data.totalWords),
      noteCount: ensureNumber(data.noteCount),
    };
  })
  .sort((a, b) => {
    // 排序优先级：finishedDate（读完时间）→ lastReadDate → readingDate
    const ad = a.finishedDate ?? a.lastReadDate ?? a.readingDate ?? "";
    const bd = b.finishedDate ?? b.lastReadDate ?? b.readingDate ?? "";
    return bd.localeCompare(ad);
  });

const BY_SLUG = new Map(ALL.map((book) => [book.slug, book]));
const DETAILS = new Map<string, ReadingEntry>();
const SECTIONS = new Map<string, { metadataHtml: string; notesHtml: string }>();

export function listReading(): ReadingEntry[] {
  return ALL.map((book) => getReadingEntry(book.slug)!);
}

/** 客户端列表使用显式字段白名单，避免传递详情正文和导出内部字段。 */
export function listReadingSummaries(): ReadingSummary[] {
  return ALL.map(({ slug, title, author, cover, category, finishedDate, readingTime, noteCount }) => ({
    slug, title, author, cover, category, finishedDate, readingTime, noteCount,
  }));
}

/** Detail-only presentation, leaving the original body and shelf data intact. */
export function getReadingSections(slug: string) {
  const cached = SECTIONS.get(slug);
  if (cached) return cached;
  const raw = RAW_BY_SLUG.get(slug);
  if (!raw) return { metadataHtml: "", notesHtml: "" };
  const parts = splitReadingMarkdown(raw.storyMd, String(raw.data.title ?? raw.fileName));
  const sections = { metadataHtml: renderMarkdown(parts.metadata), notesHtml: renderMarkdown(parts.notes) };
  SECTIONS.set(slug, sections);
  return sections;
}

export function getReadingMetadata(slug: string): ReadingMetadata | undefined {
  return BY_SLUG.get(slug);
}

export function getReadingEntry(slug: string): ReadingEntry | undefined {
  const cached = DETAILS.get(slug);
  if (cached) return cached;
  const book = BY_SLUG.get(slug);
  const raw = RAW_BY_SLUG.get(slug);
  if (!book || !raw) return undefined;
  const detail = { ...book, bodyHtml: renderMarkdown(raw.storyMd) };
  DETAILS.set(slug, detail);
  return detail;
}

/**
 * 列出所有一级分类（动态，按书数倒序）。
 * 列表页用它生成 tab，新增书籍/分类自动出现，不需要改代码。
 */
export function listReadingCategories(): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const e of ALL) {
    counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/* ================================================================
   高亮抽取
   从所有读书笔记的正文里抽出"📌 ..."这样的高亮句子，
   首页今日一句用：按当天日期当 seed，同一天稳定，跨天自动换。
================================================================ */

/**
 * 从一份原始 markdown 里提取所有 📌 划线。
 * 兼容三种排版：
 *   `> 📌 内容`
 *   `📌 内容`
 *   行尾的 obsidian 块 ID 已经在 renderMarkdown 阶段被 strip，但这里读的是原始 storyMd，
 *   所以再过一道：去掉行尾的 `^xxx-xxx-xxx`。
 */
function extractHighlightsFromMd(md: string): string[] {
  const lines = md.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    const m = /^\s*>?\s*📌\s*(.+?)\s*$/.exec(line);
    if (!m) continue;
    const cleaned = m[1].replace(/\s*\^[\w\d-]+\s*$/, "").trim();
    if (cleaned.length >= 8) out.push(cleaned);
  }
  return out;
}

/**
 * Mulberry32：种子伪随机，确定性洗牌用。
 * 同一 seed 永远返回同一序列——构建期一次性确定顺序，部署后每天稳定。
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 把 highlights 洗成"相邻不同书"的顺序：先按书分桶 round-robin，
 * 再用 mulberry32 在桶内做轻度打散，避免可预测。
 *
 * 输入是按"书"分组的二维数组，输出是扁平交错好的一维。
 *
 * 比如 [[A1,A2,A3], [B1,B2], [C1,C2,C3,C4]] →
 *   round-robin 后 [A?,B?,C?, A?,B?,C?, A?,C?, C?]
 * 任意两条相邻基本不会来自同一本书（除非某本书占比超过一半时会兜底）。
 */
function interleaveByBook(buckets: Highlight[][], seed = 1): Highlight[] {
  const rand = mulberry32(seed);
  // 桶内先 shuffle 一下，让每天都不同（同一本书内部的句子顺序）
  const shuffled = buckets.map((bucket) => {
    const arr = [...bucket];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  // round-robin：每轮从每个桶里取一个
  const out: Highlight[] = [];
  let remaining = shuffled.reduce((sum, b) => sum + b.length, 0);
  while (remaining > 0) {
    for (const bucket of shuffled) {
      if (bucket.length > 0) {
        out.push(bucket.shift()!);
        remaining--;
      }
    }
  }
  return out;
}

/** 第一次使用书摘时计算；复用原文快照，不再次读盘或渲染正文。 */
let highlightCache: Highlight[] | undefined;
function getHighlights(): Highlight[] {
  if (highlightCache) return highlightCache;
  // 先按书分桶
  const buckets: Highlight[][] = [];
  for (const { fileName, data, storyMd } of SOURCES) {
    const lines = extractHighlightsFromMd(storyMd);
    if (lines.length === 0) continue;
    const bookSlug = resolveReadingSlug(fileName, data);
    const bookTitle = (data.title as string) ?? fileName;
    const author = ensureString(data.author);
    buckets.push(
      lines.map((text) => ({ text, bookTitle, bookSlug, author }))
    );
  }
  // 桶之间也洗一下（不然总是哲学宗教先出现）
  const rand = mulberry32(20260613);
  for (let i = buckets.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [buckets[i], buckets[j]] = [buckets[j], buckets[i]];
  }
  highlightCache = interleaveByBook(buckets, 20260613);
  return highlightCache;
}

/**
 * 取"今日一句"：按 UTC 日期当 seed，整天稳定，跨天换一句。
 * 没有任何 highlight 时返回 null。
 */
export function getDailyHighlight(): Highlight | null {
  const highlights = getHighlights();
  if (highlights.length === 0) return null;
  return highlights[getDailyIndex()];
}

/** 今日 highlight 在数组中的索引，TodayHighlight 用它做"上一句/下一句"的起点 */
export function getDailyIndex(): number {
  const total = getHighlights().length;
  if (total === 0) return 0;
  const today = new Date();
  const seed =
    today.getUTCFullYear() * 10000 +
    (today.getUTCMonth() + 1) * 100 +
    today.getUTCDate();
  return seed % total;
}

export function getHighlightBatch(index: number): HighlightBatch {
  const highlights = getHighlights();
  const total = highlights.length;
  if (total === 0) return { total, items: [] };
  const center = ((index % total) + total) % total;
  const count = Math.min(5, total);
  const start = center - Math.floor(count / 2);
  return {
    total,
    items: Array.from({ length: count }, (_, offset) => {
      const index = ((start + offset) % total + total) % total;
      return { index, highlight: highlights[index] };
    }),
  };
}

/**
 * 为首页 3D 书球抽取 N 本"有封面"的书。
 *
 * 不能直接 `listReading().slice(0, N)`：那是按读完时间倒序的固定顺序，
 * 排在前 N 之外的书封面永远不会出现在球面上。
 *
 * 用 mulberry32 做确定性洗牌。seed 来源决定了"刷新会不会换书"：
 *   - 不传 seed → 默认 `Date.now()`，每次调用都换一批
 *   - 传 seed   → 同一 seed 内确定（构建期复用、单元测试可重现）
 *
 * 调用方负责确保页面是动态渲染（`export const dynamic = "force-dynamic"`），
 * 否则 build 时一次定终身，刷新不会换。
 */
function pickSphereMetadata(count: number, seed?: number): ReadingMetadata[] {
  const pool = ALL.filter((b) => b.cover);
  if (pool.length <= count) return pool;

  const rand = mulberry32(seed ?? Date.now());

  // Fisher–Yates，只洗到需要的 count 位即可，O(count) 而非 O(n)
  const arr = [...pool];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rand() * (arr.length - i));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

/** 兼容完整对象接口；首页使用摘要版本，避免无用的正文渲染。 */
export function pickSphereBooks(count: number, seed?: number): ReadingEntry[] {
  return pickSphereMetadata(count, seed).map((book) => getReadingEntry(book.slug)!);
}

export function pickSphereBookSummaries(count: number, seed?: number): ReadingSummary[] {
  return pickSphereMetadata(count, seed).map(({ slug, title, author, cover, category, finishedDate, readingTime, noteCount }) => ({
    slug, title, author, cover, category, finishedDate, readingTime, noteCount,
  }));
}
