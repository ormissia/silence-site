import { describe, expect, it, vi } from "vitest";
import { readAllJournalMdx, readAllReadingMdx, readAllWorksMdx } from "@/lib/mdx";

// Exercise real checked-in content; no OSS configuration, network or generated files.
describe("content reader boundaries", () => {
  it("returns normalized metadata instead of raw frontmatter for every domain", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const sources of [readAllReadingMdx(), readAllJournalMdx(), readAllWorksMdx()]) {
      expect(sources.length).toBeGreaterThan(0);
      for (const source of sources) {
        expect(source).toHaveProperty("metadata.slug");
        expect(source).toHaveProperty("metadata.title");
        expect(source).not.toHaveProperty("data");
        expect(typeof source.storyMd).toBe("string");
      }
    }
  });
});
