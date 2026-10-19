import { Suspense } from "react";
import { listJournalSummaries } from "@/lib/journal";
import { JournalList } from "@/components/journal/journal-list";
import { SecondaryPageHeader } from "@/components/layout/secondary-page-header";
import { CollectionLoading } from "@/components/layout/page-loading";

export const metadata = {
  title: "Journal — SILENCE",
};

export default function JournalPage() {
  const entries = listJournalSummaries();

  return (
    <section className="collection-page mx-auto max-w-[1280px] px-6 pb-20 md:px-12 lg:px-16">
      <SecondaryPageHeader
        count={`${entries.length} Notes`}
        eyebrow="Journal — Notes & Essays"
        titleEn="JOURNAL"
        titleZh="文章"
        lede="技术心得与生活随笔——慢慢攒下的字。"
      />

      <Suspense fallback={<CollectionLoading layout="journal" />}>
        <JournalList entries={entries} />
      </Suspense>
    </section>
  );
}
