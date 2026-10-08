import { describe, expect, it, vi } from "vitest";
import { parseReadingSources } from "@/lib/content/parse";

const sources = parseReadingSources([{
  sourcePath: "content/reading/历史/book.md", fileName: "Book", pathSegments: ["历史"],
  data: { bookId: 1, title: "Book", finishedDate: "2026-06-01", cover: "cover.jpg" },
  storyMd: "# Book\n\n# 元数据\n> - 分类：历史\n\n# 笔记\n> 📌 A sufficiently long highlight.",
}]);

describe("reading snapshot", () => {
  it("keeps metadata, detail rendering and highlight caches inside one source snapshot", async () => {
    const { createReadingSnapshot } = await import("@/lib/reading/snapshot");
    const render = vi.fn((markdown: string) => `<p>${markdown}</p>`);
    const snapshot = createReadingSnapshot(sources, render);
    expect(snapshot.metadata[0].slug).toBe("b1");
    expect(snapshot.getMetadata("b1")?.title).toBe("Book");
    expect(snapshot.getHighlights()).toHaveLength(1);
    expect(snapshot.getHighlights()).toBe(snapshot.getHighlights());
    expect(render).not.toHaveBeenCalled();
    const sections = snapshot.getSections("b1");
    expect(sections.notesHtml).toContain("A sufficiently long highlight.");
    expect(render).toHaveBeenCalledTimes(2);
    expect(snapshot.getSections("b1")).toBe(sections);
    const detail = snapshot.getEntry("b1");
    expect(snapshot.getEntry("b1")).toBe(detail);
    expect(render).toHaveBeenCalledTimes(3);
    expect(snapshot.getMetadata("missing")).toBeUndefined();
    expect(snapshot.getEntry("missing")).toBeUndefined();
    expect(snapshot.getSections("missing")).toEqual({ metadataHtml: "", notesHtml: "" });
  });
});
