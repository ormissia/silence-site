function Skeleton({ className }: { className: string }) {
  return <div className={`loading-skeleton ${className}`} />;
}

export default function WorkDetailLoading() {
  return (
    <article role="status" aria-busy="true" className="pb-20">
      <span className="sr-only">正在加载相册详情…</span>

      <header className="relative flex h-screen min-h-[560px] w-full items-end justify-center overflow-hidden bg-[#161616] px-6 pb-20 md:pb-28">
        <div aria-hidden="true" className="absolute left-6 top-36 h-9 w-24 rounded-full border border-white/20 bg-white/5 md:left-12" />
        <div aria-hidden="true" className="flex w-full max-w-[1100px] flex-col items-center gap-5">
          <Skeleton className="h-3 w-44 rounded-full !bg-white/10" />
          <Skeleton className="h-14 w-full max-w-[560px] rounded-lg !bg-white/10 md:h-20" />
          <Skeleton className="h-4 w-full max-w-[420px] rounded-full !bg-white/10" />
        </div>
      </header>

      <section aria-hidden="true" className="mx-auto mt-16 grid max-w-[1400px] grid-cols-12 gap-x-8 gap-y-10 px-6 md:mt-20 md:px-10">
        <div className="col-span-12 space-y-4 border-t border-rule pt-12 md:col-span-3">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-3 w-32 rounded-full" />
          <Skeleton className="h-3 w-20 rounded-full" />
        </div>
        <div className="col-span-12 space-y-5 border-t border-rule pt-12 md:col-span-9">
          <Skeleton className="h-5 w-full rounded-full" />
          <Skeleton className="h-5 w-11/12 rounded-full" />
          <Skeleton className="h-5 w-3/4 rounded-full" />
        </div>
      </section>
    </article>
  );
}
