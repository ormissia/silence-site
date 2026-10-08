import { describe, expect, it } from "vitest";

const sources = [
  { metadata: { slug: "a", title: "A", author: "Writer" }, storyMd: "> 📌 A highlight sentence. ^block-1\n📌 Another sentence here.\n📌 short\nplain text" },
  { metadata: { slug: "b", title: "B" }, storyMd: "📌 B highlight sentence." },
];

describe("pure highlight model", () => {
  it("extracts and interleaves highlights without mutating sources", async () => {
    const { buildHighlights } = await import("@/lib/reading/highlights");
    const original = structuredClone(sources);
    const highlights = buildHighlights(sources, 42);
    // Lock the original bucket shuffle + round-robin sequence, not just determinism.
    expect(highlights.map((item) => item.text)).toEqual(["A highlight sentence.", "B highlight sentence.", "Another sentence here."]);
    expect(highlights).toHaveLength(3);
    expect(highlights.map((item) => item.text).sort()).toEqual(["A highlight sentence.", "Another sentence here.", "B highlight sentence."]);
    expect(highlights[0].bookSlug).not.toBe(highlights[1].bookSlug);
    expect(highlights.find((item) => item.bookSlug === "a")?.author).toBe("Writer");
    expect(buildHighlights(sources, 42)).toEqual(highlights);
    expect(sources).toEqual(original);
    expect(buildHighlights([], 42)).toEqual([]);
  });

  it("uses the supplied UTC day and returns circular batches without duplicates", async () => {
    const { dailyHighlightIndex, highlightBatch } = await import("@/lib/reading/highlights");
    const highlights = Array.from({ length: 7 }, (_, index) => ({ text: `Quote ${index}`, bookTitle: "Book", bookSlug: "book" }));
    expect(dailyHighlightIndex(7, new Date("2026-06-15T00:00:00Z"))).toBe(20260615 % 7);
    expect(dailyHighlightIndex(7, new Date("2026-06-15T23:59:59Z"))).toBe(20260615 % 7);
    expect(dailyHighlightIndex(0, new Date("2026-06-15T00:00:00Z"))).toBe(0);
    expect(highlightBatch(highlights, 0).items.map((item) => item.index)).toEqual([5, 6, 0, 1, 2]);
    expect(highlightBatch(highlights, -1)).toEqual(highlightBatch(highlights, 6));
    expect(highlightBatch(highlights.slice(0, 2), 0).items.map((item) => item.index)).toEqual([1, 0]);
    expect(highlightBatch([], 0)).toEqual({ total: 0, items: [] });
  });
});
