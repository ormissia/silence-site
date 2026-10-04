import type { ReadingSummary } from "./reading/types";

export type ReadingYearGroup = {
  year: string | null;
  books: ReadingSummary[];
};

/** Only a recorded completion date belongs to a reading year. */
export function groupReadingByYear(books: ReadingSummary[]): ReadingYearGroup[] {
  const years = new Map<string, ReadingSummary[]>();
  const undated: ReadingSummary[] = [];

  for (const book of books) {
    const date = book.finishedDate;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
      undated.push(book);
      continue;
    }
    const year = date.slice(0, 4);
    const group = years.get(year) ?? [];
    group.push(book);
    years.set(year, group);
  }

  const groups: ReadingYearGroup[] = Array.from(years.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, entries]) => ({
      year,
      books: entries.sort((a, b) => b.finishedDate!.localeCompare(a.finishedDate!)),
    }));
  if (undated.length) groups.push({ year: null, books: undated });
  return groups;
}
