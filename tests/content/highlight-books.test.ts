import { describe, expect, it } from "vitest";
import { HOME_HIGHLIGHTS, pickHighlightBooks } from "@/lib/reading/highlight-books";
import type { ReadingSummary } from "@/lib/reading/types";

const books: ReadingSummary[] = Array.from({ length: 8 }, (_, index) => ({
  slug: `book-${index}`, title: `Book ${index}`, cover: `/cover-${index}.jpg`, category: "文学",
}));
const highlights = books.flatMap(book => Array.from({ length: 15 }, (_, index) => ({
  bookSlug: book.slug, bookTitle: book.title, text: `Sentence ${index} from ${book.title}.`,
})));

describe("homepage highlight selection", () => {
  it("samples distinct covered books and unique notes without changing cached inputs", () => {
    const input = [...highlights, ...highlights, { ...highlights[0], text: `  ${highlights[0].text}  ` }];
    const before = structuredClone({ books, input });
    const chosen = pickHighlightBooks(books, input, HOME_HIGHLIGHTS, 42);
    expect(chosen).toHaveLength(1);
    expect(new Set(chosen.map(book => book.slug)).size).toBe(1);
    for (const book of chosen) {
      expect(book.cover).toBeTruthy();
      expect(book.highlights).toHaveLength(10);
      expect(new Set(book.highlights).size).toBe(10);
      expect(book.highlights.every(text => text.endsWith(`${book.title}.`))).toBe(true);
      expect(Object.keys(book).sort()).toEqual(["author", "cover", "coverRotation", "highlights", "slug", "title"]);
      expect(Math.abs(book.coverRotation)).toBeGreaterThanOrEqual(1);
      expect(Math.abs(book.coverRotation)).toBeLessThanOrEqual(4);
    }
    expect({ books, input }).toEqual(before);
    expect(pickHighlightBooks(books, input, HOME_HIGHLIGHTS, 42)).toEqual(chosen);
    expect(pickHighlightBooks(books, input, HOME_HIGHLIGHTS, 43)).not.toEqual(chosen);
  });

  it("honors configuration and actual availability, excluding missing covers and empty notes", () => {
    const pool = [books[0], { ...books[1], cover: undefined }, { ...books[2], cover: " " }, books[3], books[4]];
    const notes = [highlights[0], highlights[0], highlights[15], highlights[30], { ...highlights[45], text: "  " }];
    expect(pickHighlightBooks(pool, notes, HOME_HIGHLIGHTS, 1)).toEqual([
      { slug: books[0].slug, title: books[0].title, cover: books[0].cover, coverRotation: expect.any(Number), author: undefined, highlights: [highlights[0].text] },
    ]);
    const limited = pickHighlightBooks(books, highlights, { bookCount: 1, maxNotesPerBook: 2 }, 1);
    expect(limited).toHaveLength(1);
    expect(limited[0].highlights).toHaveLength(2);
    expect(pickHighlightBooks(books, highlights, { bookCount: 1, maxNotesPerBook: 12 }, 1)[0].highlights).toHaveLength(12);
    expect(pickHighlightBooks([], highlights, HOME_HIGHLIGHTS, 1)).toEqual([]);
    expect(pickHighlightBooks(books, [], HOME_HIGHLIGHTS, 1)).toEqual([]);
    for (const value of [0, -1, 1.5, Infinity, NaN]) {
      expect(pickHighlightBooks(books, highlights, { bookCount: value, maxNotesPerBook: 10 }, 1)).toEqual([]);
      expect(pickHighlightBooks(books, highlights, { bookCount: 3, maxNotesPerBook: value }, 1)).toEqual([]);
    }
  });
});
