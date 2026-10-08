import "server-only";

import type { ParsedContent } from "../content/types";
import { splitReadingMarkdown } from "../reading-sections";
import { buildHighlights } from "./highlights";
import type { Highlight, ReadingEntry, ReadingMetadata } from "./types";

/** One process snapshot owns raw prose, indexes and lazy derived caches. No file scan here. */
export function createReadingSnapshot(sources: readonly ParsedContent<ReadingMetadata>[], render: (markdown: string) => string) {
  const bySlug = new Map(sources.map((source) => [source.metadata.slug, source]));
  const metadata = sources.map((source) => source.metadata).sort((a, b) => {
    const ad = a.finishedDate ?? a.lastReadDate ?? a.readingDate ?? "";
    const bd = b.finishedDate ?? b.lastReadDate ?? b.readingDate ?? "";
    return bd.localeCompare(ad);
  });
  const details = new Map<string, ReadingEntry>();
  const sections = new Map<string, { metadataHtml: string; notesHtml: string }>();
  let highlights: Highlight[] | undefined;

  return {
    metadata,
    getMetadata(slug: string): ReadingMetadata | undefined {
      return bySlug.get(slug)?.metadata;
    },
    getEntry(slug: string): ReadingEntry | undefined {
      const cached = details.get(slug);
      if (cached) return cached;
      const source = bySlug.get(slug);
      if (!source) return undefined;
      const entry = { ...source.metadata, bodyHtml: render(source.storyMd) };
      details.set(slug, entry);
      return entry;
    },
    getSections(slug: string) {
      const cached = sections.get(slug);
      if (cached) return cached;
      const source = bySlug.get(slug);
      if (!source) return { metadataHtml: "", notesHtml: "" };
      const parts = splitReadingMarkdown(source.storyMd, source.metadata.title);
      const result = { metadataHtml: render(parts.metadata), notesHtml: render(parts.notes) };
      sections.set(slug, result);
      return result;
    },
    getHighlights(): Highlight[] {
      // Preserve scan order; sorting metadata must not reorder the shuffle input.
      return highlights ??= buildHighlights(sources, 20260613);
    },
  };
}
