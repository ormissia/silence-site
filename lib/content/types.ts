import type { Photo, Work } from "../works/types";

export type ContentKind = "works" | "journal" | "reading";

export type ContentSource = {
  /** 相对于项目根目录的源文件路径，用于校验错误定位。 */
  sourcePath: string;
  fileName: string;
  pathSegments: string[];
  data: Record<string, unknown>;
  storyMd: string;
};

/** Domain queries never need to inspect untrusted frontmatter again. */
export type ParsedContent<T> = {
  sourcePath: string;
  metadata: T;
  storyMd: string;
};

/** Asset resolution happens after parsing, not inside the frontmatter boundary. */
export type ParsedWorkSource = ParsedContent<Omit<Work, "photos" | "story" | "coverWidth" | "coverHeight">> & {
  albumPrefix?: string;
  photos?: Photo[];
};
