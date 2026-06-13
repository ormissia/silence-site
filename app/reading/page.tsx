import { Suspense } from "react";
import { listReading, listReadingCategories } from "@/lib/reading";
import { ReadingShelf } from "@/components/reading/reading-shelf";

export const metadata = {
  title: "Reading — SILENCE",
};

export default function ReadingPage() {
  const books = listReading();
  const categories = listReadingCategories();

  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-32 md:px-10 md:pt-40">
      <header className="border-b border-rule pb-10">
        <p className="eyebrow">Reading — Notes from Books</p>
        <h1 className="mt-3 font-sans text-display">
          READING <span className="text-muted">/</span>{" "}
          <span className="italic">读书笔记</span>
        </h1>
        <p className="mt-6 max-w-column font-sans text-lede text-ink/80">
          一本本读过的书，划过的句子，留给以后的自己。
        </p>
      </header>

      {books.length === 0 ? (
        <p className="mt-24 text-center font-sans text-muted">
          还没有读书笔记。把微信读书导出的 markdown 放到 <code>content/reading/</code> 下即可。
        </p>
      ) : (
        <Suspense
          fallback={
            <div className="mt-12 h-[60vh] border-b border-rule/60" aria-hidden />
          }
        >
          <ReadingShelf books={books} categories={categories} />
        </Suspense>
      )}
    </section>
  );
}
