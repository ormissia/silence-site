import { Suspense } from "react";
import { listJournal } from "@/lib/journal";
import { JournalList } from "@/components/journal/journal-list";
import { SecondaryPageHeader } from "@/components/layout/secondary-page-header";

export const metadata = {
  title: "Journal — SILENCE",
};

export default function JournalPage() {
  const entries = listJournal();

  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-32 md:px-10 md:pt-40">
      <SecondaryPageHeader
        eyebrow="Journal — Notes & Essays"
        titleEn="JOURNAL"
        titleZh="文章"
        lede="技术心得与生活随笔——慢慢攒下的字。"
      />

      <Suspense
        fallback={
          <div className="mt-12 h-[60vh] border-b border-rule/60" aria-hidden />
        }
      >
        <JournalList entries={entries} />
      </Suspense>
    </section>
  );
}
