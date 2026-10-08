import { describe, expect, it, vi } from "vitest";
import type { ContentSource } from "@/lib/content/types";

const readingSource = (data: Record<string, unknown> = {}): ContentSource => ({
  sourcePath: "content/reading/历史/Book.md",
  fileName: "Book",
  pathSegments: ["历史"],
  data,
  storyMd: "# Book\n\nNotes stay raw.",
});

describe("typed content parsing", () => {
  it("normalizes reading metadata at the boundary without changing export compatibility", async () => {
    const parser = await import("@/lib/content/parse");
    const [book] = parser.parseReadingSources([readingSource({
      bookId: 123,
      isbn: 978123,
      tags: ["读书笔记", "读完", "历史"],
      readingDate: new Date("2026-01-01T00:00:00Z"),
      lastReadDate: "2026-06-01",
      finishedDate: new Date("2026-06-02T00:00:00Z"),
      readingTime: "3小时20分钟",
      noteCount: 4,
      progress: "20%",
      readProgress: 20,
      cover: null,
      ignoredExportField: { allowed: true },
    })]);
    expect(book.metadata).toMatchObject({
      slug: "b123", title: "Book", category: "历史", tags: ["读完", "历史"],
      progress: "100%", readProgress: 100, finishedDate: "2026-06-02",
      lastReadDate: "2026-06-01", readingTime: "3小时20分钟", noteCount: 4,
    });
    expect(book.metadata.readingDate).toBeUndefined();
    expect(book.metadata.isbn).toBeUndefined();
    expect(book.metadata.cover).toBeUndefined();
    expect(book.storyMd).toBe("# Book\n\nNotes stay raw.");
    expect(book).not.toHaveProperty("data");
    expect(book.metadata).not.toHaveProperty("ignoredExportField");
  });

  it("resolves journal fallback categories and relative covers without changing external covers", async () => {
    const parser = await import("@/lib/content/parse");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const raw = { ...readingSource(), sourcePath: "content/journal/tech/example.mdx", pathSegments: ["tech"], data: {
      title: "Journal", slug: " custom ", date: "June 2026", category: "unknown", cover: "cover.jpg", excerpt: null,
    } };
    const [entry] = parser.parseJournalSources([raw]);
    expect(entry.metadata).toMatchObject({ slug: "custom", title: "Journal", date: "June 2026", category: "tech", cover: "journal/tech/cover.jpg" });
    expect(entry.metadata.excerpt).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("[category]"));
    for (const cover of ["works/film/album/cover.jpg", "https://example.test/cover.jpg"]) {
      expect(parser.parseJournalSources([{ ...raw, data: { ...raw.data, cover } }])[0].metadata.cover).toBe(cover);
    }
  });

  it("returns typed work metadata and an explicit album source without resolving images prematurely", async () => {
    const parser = await import("@/lib/content/parse");
    const source: ContentSource = {
      ...readingSource(), pathSegments: ["film"], sourcePath: "content/works/film/album.mdx",
      data: { title: "Album", date: "2026-06-01", location: "City", deck: "Deck", album: "/roll/", cover: "cover.jpg", exif: { camera: "Camera", lens: "Lens", film: "Film" } },
    };
    const [work] = parser.parseWorkSources([source]);
    expect(work.metadata).toMatchObject({ slug: "Book", title: "Album", series: "胶片", date: "2026-06-01", cover: "cover.jpg", exif: { camera: "Camera", lens: "Lens", film: "Film" } });
    expect(work.albumPrefix).toBe("works/film/roll");
    expect(work.photos).toBeUndefined();
    expect(work).not.toHaveProperty("data");
    const [explicit] = parser.parseWorkSources([{ ...source, data: { ...source.data, cover: "https://example.test/cover.jpg", photos: [{ key: "works/other/a.jpg", width: 600, height: 400 }] } }]);
    expect(explicit.albumPrefix).toBeUndefined();
    expect(explicit.metadata.cover).toBe("https://example.test/cover.jpg");
    expect(explicit.photos).toEqual([{ key: "works/other/a.jpg", width: 600, height: 400, caption: undefined }]);
    expect(parser.parseWorkSources([{ ...source, data: { ...source.data, photos: [] } }])[0].albumPrefix).toBeUndefined();
  });
});
