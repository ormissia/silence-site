import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseWorkSources } from "@/lib/content/parse";

const mocks = vi.hoisted(() => ({
  mode: vi.fn(), prepareManifest: vi.fn(), readManifest: vi.fn(), prepareMeta: vi.fn(), readMeta: vi.fn(),
}));
vi.mock("@/lib/oss-cache", () => ({ canPrepareResources: mocks.mode }));
vi.mock("@/lib/oss-list", () => ({ prepareAlbumManifest: mocks.prepareManifest, readAlbumManifest: mocks.readManifest }));
vi.mock("@/lib/image-meta", () => ({ prepareImageMeta: mocks.prepareMeta, readImageMeta: mocks.readMeta }));
vi.mock("@/lib/mdx", () => ({ readAllWorksMdx: () => parseWorkSources([{
  sourcePath: "content/works/film/test.mdx", fileName: "test", pathSegments: ["film"], storyMd: "Story",
  data: { title: "Test", date: "2026-06-01", location: "City", deck: "Deck", album: "test", exif: { camera: "Camera", lens: "Lens" } },
}]) }));

beforeEach(() => {
  vi.resetModules();
  vi.spyOn(console, "log").mockImplementation(() => {});
  for (const method of [mocks.prepareManifest, mocks.readManifest]) method.mockResolvedValue({ "works/film/test": ["works/film/test/1.jpg"] });
  for (const method of [mocks.prepareMeta, mocks.readMeta]) method.mockResolvedValue({ "works/film/test/1.jpg": { w: 800, h: 600 } });
});

describe("work resource composition boundary", () => {
  it.each([true, false])("selects explicit preparation=%s once for both resource operations", async (preparing) => {
    mocks.mode.mockReturnValue(preparing);
    const { listWorkSummaries } = await import("@/lib/works");
    await expect(listWorkSummaries()).resolves.toHaveLength(1);
    expect(preparing ? mocks.prepareManifest : mocks.readManifest).toHaveBeenCalledOnce();
    expect(preparing ? mocks.prepareMeta : mocks.readMeta).toHaveBeenCalledOnce();
    expect(preparing ? mocks.readManifest : mocks.prepareManifest).not.toHaveBeenCalled();
    expect(preparing ? mocks.readMeta : mocks.prepareMeta).not.toHaveBeenCalled();
    expect(mocks.mode).toHaveBeenCalledOnce();
  });
});
