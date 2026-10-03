import type { ReadingEntry } from "./reading";

export function readingMinutes(time?: string): number | null {
  const match = time?.trim().match(/^(?:(\d+)小时)?(?:(\d+)分钟)?$/);
  if (!match || (!match[1] && !match[2])) return null;
  return Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0);
}

export function readingCategoryStatistics(books: ReadingEntry[]) {
  const categories = new Map<string, { category: string; count: number; minutes: number }>();
  let missingTime = 0;
  for (const book of books) {
    const entry = categories.get(book.category) ?? { category: book.category, count: 0, minutes: 0 };
    const minutes = readingMinutes(book.readingTime);
    entry.count += 1;
    entry.minutes += minutes ?? 0;
    if (minutes === null) missingTime += 1;
    categories.set(book.category, entry);
  }
  return {
    categories: Array.from(categories.values()).sort((a, b) => a.category.localeCompare(b.category, "zh-CN")),
    totalMinutes: Array.from(categories.values()).reduce((total, entry) => total + entry.minutes, 0),
    totalCount: books.length,
    missingTime,
  };
}
