type CollectionLayout = "works" | "journal" | "reading";

function Skeleton({ className }: { className?: string }) {
  return <div className={`loading-skeleton ${className}`} />;
}

export function LoadingIndicator({ className = "h-px w-28" }: { className?: string }) {
  return <div aria-hidden="true" className={`loading-indicator overflow-hidden rounded-full ${className}`} />;
}

/** 保留首页首屏与阅读区的占位；其他路由共享同一加载光带。 */
export function PageLoading({ heroOnly = false }: { heroOnly?: boolean }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">正在加载页面…</span>
      <section className="relative flex h-screen w-full items-center justify-center bg-paper" aria-hidden="true">
        <div className="flex flex-col items-center gap-6">
          <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-ink/70">SILENCE</span>
          <LoadingIndicator />
        </div>
      </section>
      {!heroOnly && <section className="h-screen w-full bg-paper" aria-hidden="true" />}
    </div>
  );
}

/**
 * Works 骨架：与列表同构——筛选胶囊 + 年份标题 + 高低错落的瀑布流卡片。
 * 比例刻意参差，暗示保持原始比例的封面。
 */
const WORK_CARD_RATIOS = ["aspect-[3/2]", "aspect-[4/3]", "aspect-[3/2]", "aspect-[5/4]", "aspect-[3/2]", "aspect-[4/3]"];

export function CollectionLoading({ layout = "works" }: { layout?: CollectionLayout }) {
  const label = { works: "作品", journal: "文章", reading: "书架" }[layout];

  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">正在加载{label}…</span>
      <div aria-hidden="true">
        <div className="my-4 flex gap-2 overflow-hidden pb-2 md:my-6">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-8 w-20 shrink-0 rounded-full" />
          ))}
        </div>
        {layout === "works" && (
          <div className="pb-16 pt-8 md:pt-10">
            <div className="mb-6 flex items-baseline justify-between gap-6">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-3 w-10" />
            </div>
            <div className="grid grid-cols-1 items-start gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
              {WORK_CARD_RATIOS.map((ratio, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className={`${ratio} w-full rounded-sm`} />
                  <Skeleton className="h-3 w-2/5" />
                </div>
              ))}
            </div>
          </div>
        )}
        {layout === "journal" && (
          <div className="space-y-6 pb-16 pt-2">
            {[0, 1].map((index) => (
              <div key={index} className="grid overflow-hidden rounded-xl border border-ink/10 bg-surface md:grid-cols-[200px_minmax(0,1fr)]">
                <div className="flex items-start justify-between gap-4 p-5 md:flex-col md:p-6">
                  <Skeleton className="h-14 w-16 rounded-lg" />
                  <Skeleton className="h-3 w-20 rounded-full" />
                </div>
                <Skeleton className="aspect-video md:aspect-[5/2]" />
              </div>
            ))}
          </div>
        )}
        {layout === "reading" && (
          <div className="reading-shelf-grid mt-5 sm:mt-8">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="aspect-[2/3]" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
