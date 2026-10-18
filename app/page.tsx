import { Suspense } from "react";
import { CinemaHero } from "@/components/cinema-hero";
import { HomeSplash } from "@/components/home/home-splash";
import { ReadingBackground } from "@/components/home/reading-background";
import { ReadingScene } from "@/components/home/reading-scene";
import { SelectedWorks } from "@/components/home/selected-works";
import { PageLoading } from "@/components/layout/page-loading";
import { RestoreListScroll } from "@/components/layout/list-return";
import { listFeaturedSummaries } from "@/lib/works";
import { getBookHighlights, pickSphereBookSummaries } from "@/lib/reading";

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
    highlights: getBookHighlights(b.slug),
  }));

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
        <ReadingScene books={coverBooks} />
      </ReadingBackground>
    </>
  );
}
