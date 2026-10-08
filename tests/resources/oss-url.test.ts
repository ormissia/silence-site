import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const OSS_BASE = "https://album.example.invalid";
const SPECIAL_KEY = "works/胶片/50% #? 中文%2F.jpg";
const ENCODED_KEY = "works/%E8%83%B6%E7%89%87/50%25%20%23%3F%20%E4%B8%AD%E6%96%87%252F.jpg";

describe("OSS image URLs", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_OSS_BASE_URL", OSS_BASE);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("encodes raw key segments without treating percent, hash or question mark as URL syntax", async () => {
    const { buildSrc } = await import("@/lib/oss");

    expect(buildSrc(SPECIAL_KEY, "detail")).toBe(
      `${OSS_BASE}/${ENCODED_KEY}?x-oss-process=image/resize,w_2000,h_1333,m_lfit/format,webp/quality,q_82`,
    );
  });

  it("preserves plain keys and every image preset", async () => {
    const { buildSrc, presetSize } = await import("@/lib/oss");
    const presets = [
      ["hero", 2400, 1350],
      ["gridThumb", 1200, 1500],
      ["detail", 2000, 1333],
      ["portrait", 1200, 1500],
    ] as const;

    for (const [preset, width, height] of presets) {
      expect(buildSrc("works/film/album/photo.jpg", preset)).toBe(
        `${OSS_BASE}/works/film/album/photo.jpg?x-oss-process=image/resize,w_${width},h_${height},m_lfit/format,webp/quality,q_82`,
      );
      expect(presetSize(preset)).toEqual({ width, height });
    }
  });

  it("passes external and local sources through unchanged", async () => {
    const { buildSrc, previewSrcFor } = await import("@/lib/oss");
    for (const src of [
      "https://books.example.invalid/cover%20中文.jpg?size=large#back",
      "http://books.example.invalid/cover.jpg?signature=opaque%25",
      "/covers/50% #? 中文.jpg",
    ]) {
      expect(buildSrc(src, "hero")).toBe(src);
      expect(previewSrcFor(src)).toBeUndefined();
    }
  });

  it("changes only processing options for an OSS preview", async () => {
    const { buildSrc, previewSrcFor } = await import("@/lib/oss");
    const full = new URL(buildSrc(SPECIAL_KEY, "detail"));
    const preview = new URL(previewSrcFor(full.toString())!);

    expect(preview.origin).toBe(full.origin);
    expect(preview.pathname).toBe(full.pathname);
    expect(preview.searchParams.get("x-oss-process")).toBe("image/resize,w_64,h_64,m_lfit/format,webp/quality,q_42");
    expect(decodeURIComponent(preview.pathname.slice(1))).toBe(SPECIAL_KEY);
  });

  it("preserves demo URL seeds and demo previews", async () => {
    vi.stubEnv("NEXT_PUBLIC_OSS_BASE_URL", "");
    const { buildSrc, previewSrcFor } = await import("@/lib/oss");
    const seed = encodeURIComponent(SPECIAL_KEY);

    expect(buildSrc(SPECIAL_KEY, "detail")).toBe(`https://picsum.photos/seed/${seed}/2000/1333`);
    expect(previewSrcFor(buildSrc(SPECIAL_KEY, "detail"))).toBe(`https://picsum.photos/seed/${seed}/64/64`);
  });

  it("keeps slash separators without decoding a literal percent escape", async () => {
    const { buildOssObjectUrl } = await import("@/lib/oss-url");

    expect(buildOssObjectUrl(OSS_BASE, "works//%2F/with space.jpg")).toBe(`${OSS_BASE}/works//%252F/with%20space.jpg`);
  });
});
