import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseWorkSources } from "@/lib/content/parse";
import type { ContentSource } from "@/lib/content/types";

const mocks = vi.hoisted(() => ({ read: vi.fn(), manifest: vi.fn(), meta: vi.fn() }));
vi.mock("@/lib/mdx", () => ({ readAllWorksMdx: mocks.read }));
vi.mock("@/lib/oss-list", () => ({ ensureManifest: mocks.manifest, prepareAlbumManifest: mocks.manifest, readAlbumManifest: mocks.manifest }));
vi.mock("@/lib/image-meta", () => ({ ensureMeta: mocks.meta, prepareImageMeta: mocks.meta, readImageMeta: mocks.meta }));

const source = (fileName: string, data: Record<string, unknown>): ContentSource => ({
  sourcePath: `content/works/film/${fileName}.mdx`, fileName, pathSegments: ["film"], storyMd: "First paragraph.\n\nSecond paragraph.",
  data: { title: fileName, date: "2026-06-01", location: "City", deck: "Deck", exif: { camera: "Camera", lens: "Lens" }, ...data },
});

beforeEach(() => {
  vi.resetModules();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  mocks.manifest.mockResolvedValue({ "works/film/roll": ["works/film/roll/10.jpg", "works/film/roll/cover.jpg", "works/film/roll/2.jpg"], "works/film/empty": [] });
  mocks.meta.mockResolvedValue({ "works/film/roll/cover.jpg": { w: 1200, h: 800 }, "works/film/roll/2.jpg": { w: 800, h: 1200 } });
});

describe("typed work queries", () => {
  it("assembles albums from parsed sources and keeps summary fields lean", async () => {
    mocks.read.mockReturnValue(parseWorkSources([source("album", { album: "roll" }), source("empty", { album: "empty" })]));
    const works = await import("@/lib/works");
    const summaries = await works.listWorkSummaries();
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).not.toHaveProperty("photos");
    expect(summaries[0]).not.toHaveProperty("story");
    expect(summaries[0]).not.toHaveProperty("exif");
    const album = await works.getWork("album");
    expect(summaries[0].cover).toBe("works/film/roll/cover.jpg");
    expect(album?.photos.map((photo) => photo.key)).toEqual(["works/film/roll/2.jpg", "works/film/roll/10.jpg"]);
    expect(album?.coverWidth).toBe(1200);
    expect(album?.photos[0]).toMatchObject({ width: 800, height: 1200 });
    expect(album?.story).toEqual(["First paragraph.", "Second paragraph."]);
    expect(await works.getWork("empty")).toBeUndefined();
    expect(mocks.read).toHaveBeenCalledTimes(1);
  });

  it("preserves explicit photos, external cover and supplied dimensions", async () => {
    mocks.read.mockReturnValue(parseWorkSources([source("explicit", { album: "roll", cover: "https://example.test/cover.jpg", photos: [{ key: "works/film/roll/2.jpg", width: 100, height: 200 }] })]));
    const works = await import("@/lib/works");
    const album = await works.getWork("explicit");
    expect(album?.cover).toBe("https://example.test/cover.jpg");
    expect(album?.photos[0]).toMatchObject({ width: 100, height: 200 });
    expect(mocks.manifest).toHaveBeenCalledWith([]);
    expect(mocks.meta).toHaveBeenCalledWith(["works/film/roll/2.jpg"]);
  });

  it("clears failed loading promises so another query can retry", async () => {
    mocks.read.mockReturnValue(parseWorkSources([source("album", { album: "roll" })]));
    mocks.manifest.mockRejectedValueOnce(new Error("temporary failure"));
    const works = await import("@/lib/works");
    await expect(works.listWorkSummaries()).rejects.toThrow("temporary failure");
    await expect(works.listWorkSummaries()).resolves.toHaveLength(1);
  });

  it("uses an explicit PNG cover without adding any cover variant to the photo list", async () => {
    mocks.read.mockReturnValue(parseWorkSources([source("album", { album: "roll", cover: "cover.png" })]));
    mocks.manifest.mockResolvedValue({ "works/film/roll": ["works/film/roll/COVER.JPG", "works/film/roll/cover.png", "works/film/roll/11.jpg", "works/film/roll/2.jpg"] });
    const { getWork } = await import("@/lib/works");
    const work = await getWork("album");
    expect(work?.cover).toBe("works/film/roll/cover.png");
    expect(work?.photos.map(({ key }) => key)).toEqual(["works/film/roll/2.jpg", "works/film/roll/11.jpg"]);
    expect(mocks.meta).toHaveBeenCalledWith(["works/film/roll/cover.png", "works/film/roll/2.jpg", "works/film/roll/11.jpg"]);
  });

  it("keeps the first numbered photo when an album has no dedicated cover", async () => {
    mocks.read.mockReturnValue(parseWorkSources([source("album", { album: "roll" })]));
    mocks.manifest.mockResolvedValue({ "works/film/roll": ["works/film/roll/10.jpg", "works/film/roll/2.jpg"] });
    const { getWork } = await import("@/lib/works");
    const work = await getWork("album");
    expect(work?.cover).toBe("works/film/roll/2.jpg");
    expect(work?.photos.map(({ key }) => key)).toEqual(["works/film/roll/2.jpg", "works/film/roll/10.jpg"]);
  });

  it("does not expose an album containing only a dedicated cover as a photo collection", async () => {
    mocks.read.mockReturnValue(parseWorkSources([source("album", { album: "roll", cover: "cover.png" })]));
    mocks.manifest.mockResolvedValue({ "works/film/roll": ["works/film/roll/cover.png"] });
    const { listWorkSummaries } = await import("@/lib/works");
    expect(await listWorkSummaries()).toEqual([]);
  });

  it("removes the cover from explicit photos while preserving photo metadata", async () => {
    mocks.read.mockReturnValue(parseWorkSources([source("explicit", {
      cover: "https://example.test/poster.png",
      photos: [{ key: "https://example.test/poster.png" }, { key: "works/film/roll/2.jpg", width: 100, height: 200, caption: "Original" }],
    })]));
    const { getWork } = await import("@/lib/works");
    const work = await getWork("explicit");
    expect(work?.cover).toBe("https://example.test/poster.png");
    expect(work?.photos).toEqual([{ key: "works/film/roll/2.jpg", width: 100, height: 200, caption: "Original" }]);
  });
});
