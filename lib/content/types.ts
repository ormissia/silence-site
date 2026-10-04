export type ContentKind = "works" | "journal" | "reading";

export type ContentSource = {
  /** 相对于项目根目录的源文件路径，用于校验错误定位。 */
  sourcePath: string;
  fileName: string;
  pathSegments: string[];
  data: Record<string, unknown>;
  storyMd: string;
};
