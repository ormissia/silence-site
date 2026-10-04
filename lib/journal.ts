import "server-only";

import { readAllJournalMdx } from "./mdx";
import { renderMarkdown } from "./markdown";
import { normalizeDateMaybe, resolveContentSlug } from "./content/fields";
import type { JournalEntry, JournalSummary } from "./journal/types";
import {
  JOURNAL_CATEGORIES,
  JOURNAL_CATEGORY_LABELS,
  type JournalCategory,
} from "./journal-categories";

export { JOURNAL_CATEGORIES, JOURNAL_CATEGORY_LABELS };
export type { JournalCategory };
export type { JournalEntry, JournalDetail, JournalSummary } from "./journal/types";

/**
 * category 解析顺序（与 lib/reading 一致）：
 *   1. frontmatter 的 `category` 字段
 *   2. 文件相对 content/journal/ 的第一级目录名（如 tech/、life/）
 *   3. 都没有 → "life"
 */
function resolveCategory(
  pathSegments: string[],
  data: Record<string, unknown>
): JournalCategory {
  const fromData =
    typeof data.category === "string" ? data.category.toLowerCase() : "";
  if ((JOURNAL_CATEGORIES as readonly string[]).includes(fromData)) {
    return fromData as JournalCategory;
  }
  const fromPath = pathSegments[0]?.toLowerCase() ?? "";
  if ((JOURNAL_CATEGORIES as readonly string[]).includes(fromPath)) {
    return fromPath as JournalCategory;
  }
  return "life";
}

/**
 * frontmatter 的 cover 只写图片文件名（如 "000106530022.jpg"）时，
 * 按 MDX 所在目录拼成 OSS key：journal/<category>/<filename>。
 * 已经写成完整 key（含 "/"）或外链（http(s)://）则原样透传，
 * 留出"特殊情况手动写全路径"的口子。
 */
function resolveCover(
  raw: unknown,
  category: JournalCategory
): string | undefined {
  if (typeof raw !== "string" || raw.length === 0) return undefined;
  if (/^https?:\/\//.test(raw)) return raw;
  if (raw.includes("/")) return raw;
  return `journal/${category}/${raw}`;
}

const SOURCES = readAllJournalMdx();
const RAW_BY_SLUG = new Map(SOURCES.map((raw) => [resolveContentSlug(raw.fileName, raw.data), raw]));
const ALL: JournalSummary[] = SOURCES
  .map(({ fileName, pathSegments, data }) => {
    const category = resolveCategory(pathSegments, data);
    return {
      slug: resolveContentSlug(fileName, data),
      title: data.title as string,
      date: normalizeDateMaybe(data.date) ?? "",
      category,
      cover: resolveCover(data.cover, category),
      excerpt: data.excerpt as string | undefined,
      location: data.location as string | undefined,
      mood: data.mood as string | undefined,
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

const BY_SLUG = new Map(ALL.map((entry) => [entry.slug, entry]));
const DETAILS = new Map<string, JournalEntry>();

export function listJournal(category?: JournalCategory): JournalEntry[] {
  return listJournalSummaries(category).map((entry) => getJournalEntry(entry.slug)!);
}

/** 随笔列表仅返回卡片使用的元数据。 */
export function listJournalSummaries(category?: JournalCategory): JournalSummary[] {
  const entries = category ? ALL.filter((entry) => entry.category === category) : ALL;
  return entries.map(({ slug, title, date, category, cover, excerpt, location, mood }) => ({
    slug, title, date, category, cover, excerpt, location, mood,
  }));
}

export function getJournalSummary(slug: string): JournalSummary | undefined {
  return BY_SLUG.get(slug);
}

export function getJournalEntry(slug: string): JournalEntry | undefined {
  const cached = DETAILS.get(slug);
  if (cached) return cached;
  const entry = BY_SLUG.get(slug);
  const raw = RAW_BY_SLUG.get(slug);
  if (!entry || !raw) return undefined;
  const detail = { ...entry, bodyHtml: renderMarkdown(raw.storyMd) };
  DETAILS.set(slug, detail);
  return detail;
}
