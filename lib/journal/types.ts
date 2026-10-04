import type { JournalCategory } from "../journal-categories";

/** 随笔列表所需信息，不包含正文。 */
export type JournalSummary = {
  slug: string;
  title: string;
  date: string;
  category: JournalCategory;
  cover?: string;
  excerpt?: string;
  location?: string;
  mood?: string;
};

export type JournalDetail = JournalSummary & {
  bodyHtml: string;
};

/** 兼容现有完整随笔查询接口。 */
export type JournalEntry = JournalDetail;
