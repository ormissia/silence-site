import { listReadingSummaries } from "@/lib/reading";
import { ReadingEvolution } from "@/components/reading/reading-evolution";

export const metadata = { title: "阅读演化 — SILENCE" };

export default function ReadingEvolutionPage() {
  const books = listReadingSummaries();
  return <ReadingEvolution books={books} />;
}
