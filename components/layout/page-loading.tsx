type CollectionLayout = "works" | "journal" | "reading";

function Skeleton({ className }: { className: string }) {
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

/** 路由 loading 与页内 Suspense 共用，骨架比例跟随各列表布局。 */
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
          <div className="grid grid-cols-1 gap-5 pb-16 md:grid-cols-2">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="aspect-video rounded-xl" />
            ))}
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
          <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-10 sm:mt-8 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index}>
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton className="mt-3 h-3 w-4/5 rounded-full" />
                <Skeleton className="mt-2 h-2 w-1/2 rounded-full" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
