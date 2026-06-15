import { readAllJournalMdx } from "./mdx";
import { renderMarkdown } from "./markdown";
import {
  JOURNAL_CATEGORIES,
  JOURNAL_CATEGORY_LABELS,
  type JournalCategory,
} from "./journal-categories";

export { JOURNAL_CATEGORIES, JOURNAL_CATEGORY_LABELS };
export type { JournalCategory };

export type JournalEntry = {
  slug: string;
  title: string;
  date: string; // yyyy-mm-dd
  category: JournalCategory;
  cover?: string;
  excerpt?: string;
  location?: string;
  mood?: string;
  /** 已经在 server 端渲染好的 HTML，直接 dangerouslySetInnerHTML 用 */
  bodyHtml: string;
};

function normalizeDate(raw: unknown): string {
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  if (typeof raw === "string") return raw;
  return "";
}

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

const ALL: JournalEntry[] = readAllJournalMdx()
  .map(({ slug, pathSegments, data, storyMd }) => {
    const category = resolveCategory(pathSegments, data);
    return {
      slug,
      title: data.title as string,
      date: normalizeDate(data.date),
      category,
      cover: resolveCover(data.cover, category),
      excerpt: data.excerpt as string | undefined,
      location: data.location as string | undefined,
      mood: data.mood as string | undefined,
      bodyHtml: renderMarkdown(storyMd),
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export function listJournal(category?: JournalCategory): JournalEntry[] {
  if (!category) return ALL;
  return ALL.filter((e) => e.category === category);
}

export function getJournalEntry(slug: string): JournalEntry | undefined {
  return ALL.find((e) => e.slug === slug);
}
