import { mulberry32 } from "./selection";
import type { Highlight, HighlightBatch, ReadingMetadata } from "./types";

type HighlightSource = {
  metadata: Pick<ReadingMetadata, "slug" | "title" | "author">;
  storyMd: string;
};

function extractHighlights(markdown: string): string[] {
  const highlights: string[] = [];
  for (const line of markdown.split("\n")) {
    const match = /^\s*>?\s*📌\s*(.+?)\s*$/.exec(line);
    if (!match) continue;
    const text = match[1].replace(/\s*\^[\w\d-]+\s*$/, "").trim();
    if (text.length >= 8) highlights.push(text);
  }
  return highlights;
}

/** Keep the existing seeded book/quote shuffle and round-robin ordering. */
export function buildHighlights(sources: readonly HighlightSource[], seed: number): Highlight[] {
  const buckets = sources.flatMap(({ metadata, storyMd }) => {
    const { slug: bookSlug, title: bookTitle, author } = metadata;
    const lines = extractHighlights(storyMd);
    return lines.length ? [lines.map((text) => ({ text, bookTitle, bookSlug, author }))] : [];
  });
  const bookRandom = mulberry32(seed);
  for (let index = buckets.length - 1; index > 0; index--) {
    const target = Math.floor(bookRandom() * (index + 1));
    [buckets[index], buckets[target]] = [buckets[target], buckets[index]];
  }
  const quoteRandom = mulberry32(seed);
  for (const bucket of buckets) {
    for (let index = bucket.length - 1; index > 0; index--) {
      const target = Math.floor(quoteRandom() * (index + 1));
      [bucket[index], bucket[target]] = [bucket[target], bucket[index]];
    }
  }
  const result: Highlight[] = [];
  const longest = buckets.reduce((max, bucket) => Math.max(max, bucket.length), 0);
  // Index instead of shift avoids repeatedly moving long book buckets.
  for (let index = 0; index < longest; index++) {
    for (const bucket of buckets) if (index < bucket.length) result.push(bucket[index]);
  }
  return result;
}

export function dailyHighlightIndex(total: number, today: Date): number {
  if (total === 0) return 0;
  const seed = today.getUTCFullYear() * 10000 + (today.getUTCMonth() + 1) * 100 + today.getUTCDate();
  return seed % total;
}

export function highlightBatch(highlights: readonly Highlight[], index: number): HighlightBatch {
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
