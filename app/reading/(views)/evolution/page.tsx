import { listReading } from "@/lib/reading";
import { ReadingEvolution } from "@/components/reading/reading-evolution";

export const metadata = { title: "阅读演化 — SILENCE" };

export default function ReadingEvolutionPage() {
  const books = listReading().map(({ slug, title, author, cover, category, finishedDate, readingTime, noteCount }) =>
    ({ slug, title, author, cover, category, finishedDate, readingTime, noteCount })
  );
  return <ReadingEvolution books={books} />;
}
