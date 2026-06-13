import { readAllReadingMdx } from "./mdx";
import { renderMarkdown } from "./markdown";

/**
 * 一本书的元数据 + 笔记。
 * 字段对齐微信读书导出（Obsidian 模板），可选字段尽量保留——书架页可以多角度展示。
 */
export type ReadingEntry = {
  /** URL 用 slug，不依赖文件名（避免中文文件名 percent-encode） */
  slug: string;
  title: string;
  author?: string;
  cover?: string; // 完整 URL 或 OSS key 都行
  /** 微信读书的进度百分比字符串，如 "53%" */
  progress?: string;
  /** 评分百分比字符串 */
  rating?: string;
  /** 数字进度（用于排序、过滤） */
  readProgress?: number;
  readingTime?: string;
  readingDate?: string;
  lastReadDate?: string;
  /** 读完日期（YYYY-MM-DD），书架默认按这个倒序 */
  finishedDate?: string;
  /** 一级分类，已规整：取 frontmatter category 第一段或第一级目录 */
  category: string;
  /** frontmatter 原始 category 字段（含次级，如"哲学宗教 西方哲学"） */
  rawCategory?: string;
  tags?: string[];
  isbn?: string;
  totalWords?: number;
  /** 整理好的 HTML，包含书摘正文 */
  bodyHtml: string;
};

function ensureString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function ensureNumber(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

function ensureStringArray(v: unknown): string[] | undefined {
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v as string[];
  return undefined;
}

/** YAML 里没引号的 ISO 日期会被解析成 Date 对象，归一为 yyyy-mm-dd 字符串 */
function normalizeDateMaybe(v: unknown): string | undefined {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "string" && v.length > 0) return v;
  return undefined;
}

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

/**
 * 决定一本书的 URL slug。优先级：
 * 1. frontmatter 显式 `slug` —— 老公手写的最稳
 * 2. frontmatter `bookId` —— 微信读书导出自带，全局唯一数字
 * 3. frontmatter `isbn` —— 标准化 ID
 * 4. 文件名 hash —— 兜底，从中文文件名生成 8 位短码（FNV-1a）
 *
 * 永远不直接用文件名做 URL，避免中文 URL 编码问题。
 */
function resolveSlug(fileName: string, data: Record<string, unknown>): string {
  const explicit = ensureString(data.slug);
  if (explicit) return explicit;
  const bookId =
    ensureString(data.bookId) ??
    (typeof data.bookId === "number" ? String(data.bookId) : undefined);
  if (bookId) return `b${bookId}`;
  const isbn = ensureString(data.isbn);
  if (isbn) return `isbn-${isbn.replace(/[^\w-]/g, "")}`;
  return `book-${fnv1aHex(fileName)}`;
}

/** FNV-1a 32-bit hash，输出 8 位 hex；纯函数，跨平台一致 */
function fnv1aHex(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

const ALL: ReadingEntry[] = readAllReadingMdx()
  .map(({ slug: fileSlug, pathSegments, data, storyMd }) => {
    const { visible: visibleTags, finished } = processTags(
      ensureStringArray(data.tags)
    );
    const rawProgress = ensureString(data.progress);
    const rawReadProgress = ensureNumber(data.readProgress);
    return {
      // 用 fileSlug 当 fallback hash 的输入，但永远不直接当 URL slug
      slug: resolveSlug(fileSlug, data),
      title: (data.title as string) ?? fileSlug,
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
      bodyHtml: renderMarkdown(storyMd),
    };
  })
  .sort((a, b) => {
    // 排序优先级：finishedDate（读完时间）→ lastReadDate → readingDate
    const ad = a.finishedDate ?? a.lastReadDate ?? a.readingDate ?? "";
    const bd = b.finishedDate ?? b.lastReadDate ?? b.readingDate ?? "";
    return bd.localeCompare(ad);
  });

export function listReading(): ReadingEntry[] {
  return ALL;
}

export function getReadingEntry(slug: string): ReadingEntry | undefined {
  return ALL.find((e) => e.slug === slug);
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

export type Highlight = {
  /** 划线正文 */
  text: string;
  /** 来源书名 */
  bookTitle: string;
  /** 书的 slug，用于跳转 */
  bookSlug: string;
  /** 作者，可选 */
  author?: string;
};

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

import { readAllReadingMdx as _readAllReadingMdx } from "./mdx";

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

/** 缓存所有 highlight，相邻不同书顺序，模块加载一次性算好 */
const ALL_HIGHLIGHTS: Highlight[] = (() => {
  // 先按书分桶
  const buckets: Highlight[][] = [];
  for (const { slug: fileSlug, data, storyMd } of _readAllReadingMdx()) {
    const lines = extractHighlightsFromMd(storyMd);
    if (lines.length === 0) continue;
    const bookSlug = resolveSlug(fileSlug, data);
    const bookTitle = (data.title as string) ?? fileSlug;
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
  return interleaveByBook(buckets, 20260613);
})();

/**
 * 取"今日一句"：按 UTC 日期当 seed，整天稳定，跨天换一句。
 * 没有任何 highlight 时返回 null。
 */
export function getDailyHighlight(): Highlight | null {
  if (ALL_HIGHLIGHTS.length === 0) return null;
  return ALL_HIGHLIGHTS[getDailyIndex()];
}

/** 今日 highlight 在数组中的索引，TodayHighlight 用它做"上一句/下一句"的起点 */
export function getDailyIndex(): number {
  if (ALL_HIGHLIGHTS.length === 0) return 0;
  const today = new Date();
  const seed =
    today.getUTCFullYear() * 10000 +
    (today.getUTCMonth() + 1) * 100 +
    today.getUTCDate();
  return seed % ALL_HIGHLIGHTS.length;
}

/** 全量导出，让客户端组件能在本地切换上一/下一句而不用走 API */
export function listHighlights(): Highlight[] {
  return ALL_HIGHLIGHTS;
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
export function pickSphereBooks(count: number, seed?: number): ReadingEntry[] {
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
