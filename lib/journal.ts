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

function normalizeCategory(raw: unknown): JournalCategory {
  if (typeof raw === "string") {
    const lower = raw.toLowerCase();
    if ((JOURNAL_CATEGORIES as readonly string[]).includes(lower)) {
      return lower as JournalCategory;
    }
  }
  return "life"; // 缺省归到 life
}

const ALL: JournalEntry[] = readAllJournalMdx()
  .map(({ slug, data, storyMd }) => ({
    slug,
    title: data.title as string,
    date: normalizeDate(data.date),
    category: normalizeCategory(data.category),
    cover: data.cover as string | undefined,
    excerpt: data.excerpt as string | undefined,
    location: data.location as string | undefined,
    mood: data.mood as string | undefined,
    bodyHtml: renderMarkdown(storyMd),
  }))
  .sort((a, b) => b.date.localeCompare(a.date));

export function listJournal(category?: JournalCategory): JournalEntry[] {
  if (!category) return ALL;
  return ALL.filter((e) => e.category === category);
}

export function getJournalEntry(slug: string): JournalEntry | undefined {
  return ALL.find((e) => e.slug === slug);
}
