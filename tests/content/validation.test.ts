import { describe, expect, it, vi } from "vitest";
import { assertValidContent, assertValidDateLiterals } from "@/lib/content/validation";
import { parseReadingSources, parseWorkSources } from "@/lib/content/parse";
import type { ContentSource } from "@/lib/content/types";

const source: ContentSource = {
  sourcePath: "content/journal/tech/example.mdx",
  fileName: "example",
  pathSegments: ["tech"],
  data: { title: "Example", date: "June 2026", category: "other" },
  storyMd: "Notes",
};

describe("content diagnostics", () => {
  it("reports compatible fallbacks instead of silently discarding warnings", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => assertValidContent("journal", [source])).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("content/journal/tech/example.mdx [date]"));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("[category]"));
  });

  it("rejects duplicate final slugs and invalid field types before domain mapping", () => {
    const book = { ...source, data: { title: "Book", bookId: 123 }, pathSegments: ["历史"] };
    expect(() => parseReadingSources([book, { ...book, sourcePath: "content/reading/另一类/Book.md" }])).toThrow("duplicate resolved slug");
    expect(() => parseReadingSources([{ ...book, data: { title: "Book", readProgress: "100" } }])).toThrow("[readProgress]");
    expect(() => parseReadingSources([{ ...book, data: { title: "Book", slug: "a/b" } }])).toThrow("[slug]");
  });

  it("rejects invalid calendar dates before YAML rollover hides the original literal", () => {
    expect(() => parseReadingSources([{ ...source, data: { title: "Book", finishedDate: "2026-02-30" } }])).toThrow("invalid calendar date");
    expect(() => assertValidDateLiterals("reading", { ...source, data: { finishedDate: new Date("2026-03-02T00:00:00Z") } }, "finishedDate: 2026-02-30")).toThrow("invalid calendar date");
  });

  it("rejects invalid explicit photo dimensions without coercion", () => {
    const work = { ...source, pathSegments: ["film"], data: { title: "Work", date: "2026-06-01", location: "City", deck: "Deck", exif: { camera: "Camera", lens: "Lens" }, photos: [{ key: "photo.jpg", width: 0, height: 100 }] } };
    expect(() => parseWorkSources([work])).toThrow("[photos[0].width]");
  });
});
