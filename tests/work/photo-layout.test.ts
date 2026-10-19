import { describe, expect, it } from "vitest";
import { groupAlbumPhotos } from "@/lib/works/photo-layout";

describe("album grouping", () => {
  it("separates photographs that need a full row without changing sequence or metadata", () => {
    const photos = [
      { key: "a", width: 6017, height: 4003 },
      { key: "b", width: 4001, height: 3007 },
      { key: "wide", width: 8176, height: 3018 },
      { key: "portrait", width: 3011, height: 7001 },
      { key: "wide-2", width: 9007, height: 2551 },
    ];
    const before = structuredClone(photos);
    const groups = groupAlbumPhotos(photos, 1152);
    expect(groups.map(group => group.map(photo => photo.key))).toEqual([["a", "b"], ["wide"], ["portrait"], ["wide-2"]]);
    expect(groups.flat()).toEqual(before);
    groups.flat().forEach((photo, index) => expect(photo).toBe(photos[index]));
  });

  it("reconsiders grouping when available space changes, without classifying fixed aspect ratios", () => {
    const photos = [{ width: 6123, height: 3601 }, { width: 4321, height: 3210 }];
    expect(groupAlbumPhotos(photos, 1152)).toHaveLength(1);
    expect(groupAlbumPhotos(photos, 672)).toHaveLength(2);
  });

  it("keeps empty, single-photo and consecutive wide-photo albums in order", () => {
    expect(groupAlbumPhotos([], 1152)).toEqual([]);
    const portrait = { width: 3123, height: 7151 };
    expect(groupAlbumPhotos([portrait], 1152)).toEqual([[portrait]]);
    const wide = [{ width: 10001, height: 3001 }, { width: 9001, height: 2601 }];
    expect(groupAlbumPhotos(wide, 1152)).toEqual(wide.map(photo => [photo]));
  });
});
