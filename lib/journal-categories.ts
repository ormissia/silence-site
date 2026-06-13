/**
 * Journal 分类的纯常量定义。
 * 拆出本文件以避免 client component（journal-tabs）
 * 通过 lib/journal 间接引入 node:fs 而打包失败。
 * 同 lib/categories.ts 的拆分思路。
 */

export const JOURNAL_CATEGORIES = ["tech", "life"] as const;
export type JournalCategory = (typeof JOURNAL_CATEGORIES)[number];

export const JOURNAL_CATEGORY_LABELS: Record<JournalCategory, { en: string; zh: string }> = {
  tech: { en: "Tech", zh: "技术" },
  life: { en: "Life", zh: "生活" },
};
