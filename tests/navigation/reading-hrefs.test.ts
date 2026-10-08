import { describe, expect, it } from "vitest";
import { readingBookHref, readingListHref } from "@/lib/navigation/reading";

describe("reading navigation URLs", () => {
  it.each([
    {}, { cat: null }, { cat: "" }, { cat: "all" }, { cat: ["历史", "文学"] },
    { view: ["evolution"] }, { view: "unknown" },
  ])("preserves the default/fallback URLs for %j", (context) => {
    expect(readingListHref(context)).toBe("/reading");
    expect(readingBookHref("book-42", context)).toBe("/reading/book-42");
  });

  it("does not treat an array view query as evolution", () => {
    const context = { view: ["evolution"], cat: "历史" };
    expect(readingListHref(context)).toBe("/reading?cat=%E5%8E%86%E5%8F%B2");
    expect(readingBookHref("book-42", context)).toBe("/reading/book-42?cat=%E5%8E%86%E5%8F%B2");
  });

  it("keeps evolution's list path distinct from its detail query and ignores category", () => {
    const context = { view: "evolution", cat: "历史" };
    expect(readingListHref(context)).toBe("/reading/evolution");
    expect(readingBookHref("book-42", context)).toBe("/reading/book-42?view=evolution");
  });

  it("preserves category encoding and slug bytes for both sides of the list protocol", () => {
    const context = { cat: "历史 & +/%" };
    expect(readingListHref(context)).toBe("/reading?cat=%E5%8E%86%E5%8F%B2%20%26%20%2B%2F%25");
    expect(readingBookHref("literal%2Fslug", context)).toBe("/reading/literal%2Fslug?cat=%E5%8E%86%E5%8F%B2%20%26%20%2B%2F%25");
  });
});
