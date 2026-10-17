import { mulberry32 } from "./selection";
import type { Highlight, HighlightBook, ReadingSummary } from "./types";

export const HOME_HIGHLIGHTS = {
  bookCount: 1,
  maxNotesPerBook: 10,
};

type Options = typeof HOME_HIGHLIGHTS;

function sample<T>(items: readonly T[], count: number, random: () => number): T[] {
  const pool = [...items];
  const size = Math.min(count, pool.length);
  for (let index = 0; index < size; index++) {
    const target = index + Math.floor(random() * (pool.length - index));
    [pool[index], pool[target]] = [pool[target], pool[index]];
  }
  return pool.slice(0, size);
}

export function pickHighlightBooks(
  books: readonly ReadingSummary[],
  highlights: readonly Highlight[],
  options: Options,
  seed: number,
): HighlightBook[] {
  const { bookCount, maxNotesPerBook } = options;
  if (!Number.isSafeInteger(bookCount) || !Number.isSafeInteger(maxNotesPerBook) || bookCount < 1 || maxNotesPerBook < 1) return [];
  const notes = new Map<string, Set<string>>();
  for (const highlight of highlights) {
    const text = highlight.text.replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (!notes.has(highlight.bookSlug)) notes.set(highlight.bookSlug, new Set());
    notes.get(highlight.bookSlug)!.add(text);
  }
  const eligible = books.filter(book => book.cover?.trim() && notes.has(book.slug));
  const random = mulberry32(seed);
  return sample(eligible, bookCount, random).map(({ slug, title, author, cover }) => ({
    slug, title, author, cover: cover!,
    coverRotation: (1 + random() * 3) * (random() < .5 ? -1 : 1),
    highlights: sample([...notes.get(slug)!], maxNotesPerBook, random),
  }));
}
