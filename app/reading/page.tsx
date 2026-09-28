import { Suspense } from "react";
import { listReading, listReadingCategories } from "@/lib/reading";
import { ReadingShelf } from "@/components/reading/reading-shelf";
import { SecondaryPageHeader } from "@/components/layout/secondary-page-header";
import { CollectionLoading } from "@/components/layout/page-loading";

export const metadata = {
  title: "Reading — SILENCE",
};

export default function ReadingPage() {
  const books = listReading();
  const categories = listReadingCategories();

  return (
    <section className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:px-12 md:pt-44">
      <SecondaryPageHeader
        count={`${books.length} Books`}
        eyebrow="Reading — Notes from Books"
        titleEn="READING"
        titleZh="读书笔记"
        lede="一本本读过的书，划过的句子，留给以后的自己。"
      />

      {books.length === 0 ? (
        <p className="mt-24 text-center font-sans text-muted">
          还没有读书笔记。把微信读书导出的 markdown 放到 <code>content/reading/</code> 下即可。
        </p>
      ) : (
        <Suspense fallback={<CollectionLoading layout="reading" />}>
          <ReadingShelf books={books} categories={categories} />
        </Suspense>
      )}
    </section>
  );
}
