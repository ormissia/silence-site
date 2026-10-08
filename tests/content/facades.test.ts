import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as reading from "@/lib/reading";
import * as journal from "@/lib/journal";

beforeAll(() => {
  vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
});
afterAll(() => vi.useRealTimers());

describe("content query facade compatibility", () => {
  it("keeps summaries lean and details lazy with stable identity", () => {
    const summaries = reading.listReadingSummaries();
    const first = summaries[0];
    expect(first).toBeDefined();
    expect(first).not.toHaveProperty("bodyHtml");
    expect(first).not.toHaveProperty("tags");
    expect(reading.getReadingEntry(first.slug)).toBe(reading.getReadingEntry(first.slug));
    expect(reading.getReadingSections(first.slug)).toBe(reading.getReadingSections(first.slug));
    expect(reading.getReadingEntry("missing")).toBeUndefined();
    expect(reading.getReadingSections("missing")).toEqual({ metadataHtml: "", notesHtml: "" });
    const entries = journal.listJournalSummaries();
    expect(entries[0]).not.toHaveProperty("bodyHtml");
    expect(journal.getJournalEntry(entries[0].slug)).toBe(journal.getJournalEntry(entries[0].slug));
    expect(journal.getJournalEntry("missing")).toBeUndefined();
  });

  it("keeps complete queries, sections, selection and daily highlights consistent", () => {
    const values = {
      reading: reading.listReading(),
      summaries: reading.listReadingSummaries(),
      sections: reading.listReadingSummaries().map(({ slug }) => reading.getReadingSections(slug)),
      categories: reading.listReadingCategories(),
      journal: journal.listJournal(),
      sphere: reading.pickSphereBookSummaries(50, 42),
      dailyIndex: reading.getDailyIndex(),
      batch: reading.getHighlightBatch(0),
    };
    expect(values.reading.map((book) => book.slug)).toEqual(values.summaries.map((book) => book.slug));
    expect(values.sections).toHaveLength(values.summaries.length);
    expect(values.categories.reduce((total, category) => total + category.count, 0)).toBe(values.summaries.length);
    expect(values.journal.map((entry) => entry.slug)).toEqual(journal.listJournalSummaries().map((entry) => entry.slug));
    expect(values.batch.items).toHaveLength(Math.min(5, values.batch.total));
    expect(reading.pickSphereBookSummaries(50, 42)).toEqual(values.sphere);
    const daily = reading.getHighlightBatch(values.dailyIndex).items.find((item) => item.index === values.dailyIndex)?.highlight ?? null;
    expect(reading.getDailyHighlight()).toEqual(daily);
  });
});
