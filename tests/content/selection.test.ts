import { describe, expect, it } from "vitest";

const books = Array.from({ length: 8 }, (_, index) => ({ slug: `b${index}`, title: `Book ${index}`, category: "历史", cover: index === 0 ? undefined : `${index}.jpg` }));

describe("pure reading selection", () => {
  it("selects covered books deterministically without mutating input or reading the clock", async () => {
    const { pickCoveredBooks } = await import("@/lib/reading/selection");
    const original = structuredClone(books);
    const selected = pickCoveredBooks(books, 4, 42);
    // Characterized from the original facade's seed=42 sequence.
    expect(selected.map((book) => book.slug)).toEqual(["b5", "b4", "b7", "b6"]);
    expect(selected).toHaveLength(4);
    expect(selected.every((book) => Boolean(book.cover))).toBe(true);
    expect(new Set(selected.map((book) => book.slug)).size).toBe(4);
    expect(pickCoveredBooks(books, 4, 42)).toEqual(selected);
    expect(books).toEqual(original);
    expect(pickCoveredBooks(books, 100, 42)).toEqual(books.filter((book) => book.cover));
    expect(pickCoveredBooks(books, 0, 42)).toEqual([]);
  });
});
