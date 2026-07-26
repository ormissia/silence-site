import Image from "next/image";
import Link from "next/link";
import { buildSrc, presetSize } from "@/lib/oss";
import type { Work } from "@/lib/works";

export function Hero({ work }: { work: Work }) {
  const { width, height } = presetSize("hero");

  return (
    <section className="relative">
      <div className="mx-auto max-w-[1400px] px-6 pt-12 md:px-10 md:pt-20">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">
          <div className="col-span-12 md:col-span-5 md:pt-16">
            <p className="eyebrow">Featured Story No. 01</p>
            <h1 className="mt-4 font-serif text-display">
              Quiet
              <br />
              <span className="italic text-accent">Hours.</span>
            </h1>
            <p className="mt-8 max-w-prose font-sans text-lede leading-relaxed text-ink/80">
              一组在城市边缘、清晨与傍晚之间收集的光。
              没有戏剧性的事件，只有一些被路过的瞬间。
            </p>
            <div className="mt-10 flex items-center gap-6">
              <Link
                href={`/works/${work.slug}`}
                className="border-b border-ink pb-1 font-sans text-label uppercase tracking-[0.24em] hover:text-accent hover:border-accent"
              >
                Read this issue
              </Link>
              <Link
                href="/works"
                className="font-sans text-label uppercase tracking-[0.24em] text-muted hover:text-ink"
              >
                All works →
              </Link>
            </div>
          </div>

          <div className="col-span-12 md:col-span-7">
            <div className="relative aspect-[4/5] overflow-hidden bg-ink/5 md:aspect-[5/6]">
              <Image
                src={buildSrc(work.cover, "hero")}
                alt={work.title}
                width={width}
                height={height}
                priority
                className="h-full w-full object-cover"
                sizes="(min-width: 768px) 58vw, 100vw"
              />
            </div>
            <figcaption className="mt-3 flex items-center justify-between font-sans text-label uppercase tracking-[0.18em] text-muted">
              <span>Plate No. 01 — {work.location}</span>
              <span>{work.date.slice(0, 4)}</span>
            </figcaption>
          </div>
        </div>
      </div>
    </section>
  );
}
