/** 书架、年度统计和阅读演化使用的元数据，不包含正文。 */
export type ReadingSummary = {
  /** URL 使用稳定 slug，不依赖中文文件名。 */
  slug: string;
  title: string;
  author?: string;
  cover?: string;
  /** 已归一的一级分类。 */
  category: string;
  finishedDate?: string;
  readingTime?: string;
  /** 微信读书导出的笔记数量，包含划线。 */
  noteCount?: number;
};

/** 详情保留微信读书导出的可选字段和原有 HTML 正文。 */
export type ReadingDetail = ReadingSummary & {
  progress?: string;
  rating?: string;
  readProgress?: number;
  readingDate?: string;
  lastReadDate?: string;
  rawCategory?: string;
  tags?: string[];
  isbn?: string;
  totalWords?: number;
  bodyHtml: string;
};

/** 兼容现有完整内容查询接口。 */
export type ReadingEntry = ReadingDetail;

export type Highlight = {
  text: string;
  bookTitle: string;
  bookSlug: string;
  author?: string;
};

/** 目标位置附近的书摘，索引保持全局顺序并支持首尾循环。 */
export type HighlightBatch = {
  total: number;
  items: Array<{ index: number; highlight: Highlight }>;
};
