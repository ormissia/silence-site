import { describe, expect, it } from "vitest";
import { readAllWorksMdx } from "@/lib/mdx";

const expectedSlugs = new Map([
  ["南太行", "nantaihang"],
  ["箭扣长城", "jiankouchangcheng"],
  ["北灵山", "beilingshan"],
  ["五台山", "wutaishan"],
  ["乌兰布统", "wulanbutong"],
  ["贡嘎山", "gonggashan"],
  ["依央嘉波", "yiyangjiabo"],
  ["烟台", "yantai"],
  ["一组黑白", "yizuheibai"],
  ["日常拍点花花草草", "richangpaidianhuahuacaocao"],
]);

describe("migrated work content", () => {
  it("keeps film archive numbers unique and aligned with content and OSS paths", () => {
    const films = readAllWorksMdx()
      .filter(({ sourcePath }) => sourcePath.startsWith("content/works/film/"))
      .sort((a, b) => a.metadata.slug.localeCompare(b.metadata.slug));

    expect(films.length).toBeGreaterThan(0);
    for (const [index, work] of films.entries()) {
      const number = String(index + 1).padStart(4, "0");
      expect(work.metadata.slug).toMatch(new RegExp(`^${number}-(120|135)-[a-z0-9]+$`));
      expect(work.sourcePath).toBe(`content/works/film/${work.metadata.slug}.mdx`);
      expect(work.albumPrefix).toBe(`works/film/${work.metadata.slug}`);
      expect(work.metadata.title).toMatch(new RegExp(`^No\\.${number} · `));
      expect(`${work.metadata.title} ${work.metadata.deck} ${work.storyMd}`).not.toMatch(/\(Roll \d+\)|第 \d+ 批/);
    }
  });

  it("resolves each renamed file and album through its full-pinyin slug", () => {
    const works = readAllWorksMdx();
    const slugs = works.map(({ metadata }) => metadata.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    const renamed = works.filter(({ sourcePath }) => /^content\/works\/(landscape|snapshots)\//.test(sourcePath));
    expect(renamed).toHaveLength(expectedSlugs.size);
    for (const work of renamed) {
      const slug = expectedSlugs.get(work.metadata.title);
      expect(slug, work.metadata.title).toBeDefined();
      expect(work.metadata.slug).toBe(slug);
      expect(work.metadata.cover).toBe("cover.png");
      expect(work.sourcePath).toMatch(new RegExp(`^content/works/(landscape|snapshots)/\\d{4}-\\d{2}-\\d{2}-${slug}\\.mdx$`));
      expect(work.albumPrefix).toBe(`${work.sourcePath.split("/").slice(1, 3).join("/")}/${slug}`);
    }
  });
});
