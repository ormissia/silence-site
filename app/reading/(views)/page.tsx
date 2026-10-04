import { Suspense } from "react";
import { listReadingSummaries, listReadingCategories } from "@/lib/reading";
import { ReadingShelf } from "@/components/reading/reading-shelf";
import { CollectionLoading } from "@/components/layout/page-loading";

export const metadata = {
  title: "Reading — SILENCE",
};

export default function ReadingPage() {
  const books = listReadingSummaries();
  const categories = listReadingCategories();

  return (
    <>
      {books.length === 0 ? (
        <p className="mt-24 text-center font-sans text-muted">
          还没有读书笔记。把微信读书导出的 markdown 放到 <code>content/reading/</code> 下即可。
        </p>
      ) : (
        <Suspense fallback={<CollectionLoading layout="reading" />}>
          <ReadingShelf books={books} categories={categories} />
        </Suspense>
      )}
    </>
  );
}
