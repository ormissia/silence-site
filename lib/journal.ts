import "server-only";

import { readAllJournalMdx } from "./mdx";
import { renderMarkdown } from "./markdown";
import type { JournalEntry, JournalSummary } from "./journal/types";
import {
  JOURNAL_CATEGORIES,
  JOURNAL_CATEGORY_LABELS,
  type JournalCategory,
} from "./journal-categories";

export { JOURNAL_CATEGORIES, JOURNAL_CATEGORY_LABELS };
export type { JournalCategory };
export type { JournalEntry, JournalDetail, JournalSummary } from "./journal/types";

const SOURCES = readAllJournalMdx();
const RAW_BY_SLUG = new Map(SOURCES.map((source) => [source.metadata.slug, source]));
const ALL: JournalSummary[] = SOURCES
  .map(({ metadata }) => metadata)
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
