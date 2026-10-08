import "server-only";

import { readAllReadingMdx } from "./mdx";
import { renderMarkdown } from "./markdown";
import { dailyHighlightIndex, highlightBatch } from "./reading/highlights";
import { pickCoveredBooks } from "./reading/selection";
import { createReadingSnapshot } from "./reading/snapshot";
import type { ReadingEntry, ReadingMetadata, ReadingSummary, Highlight, HighlightBatch } from "./reading/types";

export type { ReadingEntry, ReadingDetail, ReadingMetadata, ReadingSummary, Highlight, HighlightBatch } from "./reading/types";

// The facade composes file I/O once; pure algorithms never own a clock or a file reader.
const snapshot = createReadingSnapshot(readAllReadingMdx(), renderMarkdown);
const ALL = snapshot.metadata;

function toReadingSummary({ slug, title, author, cover, category, finishedDate, readingTime, noteCount }: ReadingMetadata): ReadingSummary {
  return { slug, title, author, cover, category, finishedDate, readingTime, noteCount };
}

export function listReading(): ReadingEntry[] {
  return ALL.map((book) => getReadingEntry(book.slug)!);
}

/** 客户端列表使用显式字段白名单，避免传递详情正文和导出内部字段。 */
export function listReadingSummaries(): ReadingSummary[] {
  return ALL.map(toReadingSummary);
}

/** Detail-only presentation, leaving the original body and shelf data intact. */
export function getReadingSections(slug: string) {
  return snapshot.getSections(slug);
}

export function getReadingMetadata(slug: string): ReadingMetadata | undefined {
  return snapshot.getMetadata(slug);
}

export function getReadingEntry(slug: string): ReadingEntry | undefined {
  return snapshot.getEntry(slug);
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

/**
 * 取"今日一句"：按 UTC 日期当 seed，整天稳定，跨天换一句。
 * 没有任何 highlight 时返回 null。
 */
export function getDailyHighlight(today = new Date()): Highlight | null {
  const highlights = snapshot.getHighlights();
  if (highlights.length === 0) return null;
  return highlights[dailyHighlightIndex(highlights.length, today)];
}

/** 今日 highlight 在数组中的索引，TodayHighlight 用它做"上一句/下一句"的起点 */
export function getDailyIndex(today = new Date()): number {
  return dailyHighlightIndex(snapshot.getHighlights().length, today);
}

export function getHighlightBatch(index: number): HighlightBatch {
  return highlightBatch(snapshot.getHighlights(), index);
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
  return pickCoveredBooks(ALL, count, seed ?? Date.now());
}

/** 兼容完整对象接口；首页使用摘要版本，避免无用的正文渲染。 */
export function pickSphereBooks(count: number, seed?: number): ReadingEntry[] {
  return pickSphereMetadata(count, seed).map((book) => getReadingEntry(book.slug)!);
}

export function pickSphereBookSummaries(count: number, seed?: number): ReadingSummary[] {
  return pickSphereMetadata(count, seed).map(toReadingSummary);
}
