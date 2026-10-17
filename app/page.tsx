import { Suspense } from "react";
import Link from "next/link";
import { CinemaHero } from "@/components/cinema-hero";
import { BookRows } from "@/components/home/book-rows";
import { HomeSplash } from "@/components/home/home-splash";
import { TodayHighlight } from "@/components/home/today-highlight";
import { ReadingBackground } from "@/components/home/reading-background";
import { ReadingReveal } from "@/components/home/reading-reveal";
import { SelectedWorks } from "@/components/home/selected-works";
import { PageLoading } from "@/components/layout/page-loading";
import { RestoreListScroll } from "@/components/layout/list-return";
import { listFeaturedSummaries } from "@/lib/works";
import { getDailyIndex, getHighlightBatch, pickSphereBookSummaries } from "@/lib/reading";
import { getAccentStyle } from "@/lib/accent";

// 首页书封每次刷新换一批，依赖运行时随机 seed → 不能预渲染。
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await listFeaturedSummaries();

  // 每次请求重新洗牌，从所有有封面的书里抽 30 本分成三行。
  // 不传 seed → 默认 Date.now()，每次刷新换一批。
  const coverBooks = pickSphereBookSummaries(30).map((b) => ({
    slug: b.slug,
    title: b.title,
    author: b.author,
    cover: b.cover,
  }));

  const startIndex = getDailyIndex();
  const highlights = getHighlightBatch(startIndex);

  return (
    <>
      <HomeSplash />
      <RestoreListScroll />
      <Suspense fallback={<PageLoading heroOnly />}>
        <CinemaHero />
      </Suspense>

      <SelectedWorks works={featured} />

      {/* 阅读区沿用主题纸色，照片留给页脚揭幕。 */}
      <ReadingBackground>
        <div className="relative z-10">
          <ReadingReveal>
            <header>
              <p className="font-sans text-caption uppercase text-muted">Reading &amp; Notes</p>
              <h2 id="reading-heading" className="mt-4 font-sans text-headline font-normal leading-[1.35] tracking-[0.04em]">
                字里行间
              </h2>
              <p className="mt-6 max-w-lg font-sans text-body text-ink/70">
                划过的句子比走过的路更长。让书页缓缓流过，每一本都通向一段未完的对话。
              </p>
            </header>
            <Link
              href="/reading"
              style={getAccentStyle("home:reading")}
              className="silence-pill silence-pill-accent font-sans text-ink"
            >
              进入书架 <span aria-hidden>→</span>
            </Link>

            {coverBooks.length > 0 && (
              <BookRows books={coverBooks} />
            )}
          </ReadingReveal>

          {highlights.total > 0 && (
            <div className="home-highlight mx-auto mt-16 max-w-[1400px] px-6 pb-24 pt-16 md:mt-24 md:px-10 md:pb-32 md:pt-20">
              <TodayHighlight initialBatch={highlights} startIndex={startIndex} />
            </div>
          )}
        </div>
      </ReadingBackground>
    </>
  );
}
