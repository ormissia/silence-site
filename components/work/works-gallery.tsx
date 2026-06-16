"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { RowsPhotoAlbum, type RenderPhoto } from "react-photo-album";
import "react-photo-album/rows.css";
import { buildSrc } from "@/lib/oss";
import { tabToSeries, seriesToTab } from "@/lib/categories";
import { CategoryTabs, type CategoryTab } from "@/components/layout/category-tabs";
import type { Work } from "@/lib/works";

// 探测失败 / demo 模式时的安全比例（横图 3:2），避免 Justified 布局炸
const FALLBACK_W = 3;
const FALLBACK_H = 2;

type AlbumPhoto = {
  src: string;
  width: number;
  height: number;
  key: string;
  alt: string;
  work: Work;
  no: number;
};

type Props = {
  works: Work[];
  /** 各 series 的作品数，由 server 在 page.tsx 计算后传入 */
  categoryCounts: Array<{ series: string; count: number }>;
};

export function WorksGallery({ works, categoryCounts }: Props) {
  const params = useSearchParams();
  const activeTab = params.get("tab") ?? "all";
  const activeSeries = tabToSeries(activeTab);

  const filtered = useMemo(
    () => (activeSeries ? works.filter((w) => w.series === activeSeries) : works),
    [works, activeSeries]
  );

  const albumPhotos: AlbumPhoto[] = useMemo(
    () =>
      filtered.map((w, i) => ({
        src: buildSrc(w.cover, "gridThumb"),
        width: w.coverWidth ?? FALLBACK_W,
        height: w.coverHeight ?? FALLBACK_H,
        key: w.slug,
        alt: w.title,
        work: w,
        no: i,
      })),
    [filtered]
  );

  // 把 series 计数翻译成 tab slug 计数；"全部" tab 单独拼上
  const tabs: CategoryTab[] = useMemo(() => {
    const result: CategoryTab[] = [
      { slug: "all", label: "全部", count: works.length },
    ];
    for (const { series, count } of categoryCounts) {
      result.push({ slug: seriesToTab(series), label: series, count });
    }
    return result;
  }, [works.length, categoryCounts]);

  const totalLabel = `${filtered.length} ${filtered.length > 1 ? "Works" : "Work"}`;

  return (
    <>
      <CategoryTabs
        tabs={tabs}
        paramName="tab"
        basePath="/works"
        totalLabel={totalLabel}
      />

      {/* Film 模式提示条：胶卷头/批次号信息 */}
      {activeTab === "film" && filtered.length > 0 && (
        <div className="mt-8 flex items-center gap-4 border-y-2 border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-2 font-sans text-[10px] uppercase tracking-[0.28em] text-amber-200/80">
          <span>● Film Roll</span>
          <span className="hidden md:inline">·</span>
          <span className="hidden md:inline">35mm Color Negative</span>
          <span className="hidden md:inline">·</span>
          <span className="hidden md:inline">Develop C-41</span>
          <span className="ml-auto">{new Date().getFullYear()} / Batch No. {String(filtered.length).padStart(3, "0")}</span>
        </div>
      )}

      {/* Justified Rows：每行高度对齐、按真实比例铺满，cell 下方挂标题块 */}
      {filtered.length === 0 ? (
        <p className="mt-24 text-center font-sans text-muted">没人可拍。</p>
      ) : (
        <div className={`mt-12 ${activeTab === "film" ? "film-strip" : ""}`}>
          <RowsPhotoAlbum
            photos={albumPhotos}
            targetRowHeight={420}
            spacing={32}
            padding={0}
            render={{ photo: renderWorkPhoto }}
          />
        </div>
      )}
    </>
  );
}

const renderWorkPhoto: RenderPhoto<AlbumPhoto> = (_, ctx) => {
  const { photo, width, height } = ctx;
  const { work, no, src, alt } = photo;
  const isAlbum = work.photos.length > 1;
  const photoCount = work.photos.length;
  const isFilm = work.series === "胶片";
  const filmStock = work.exif?.film;
  const filmIso = filmStock ? /\b(\d{2,4})\b/.exec(filmStock)?.[1] : undefined;

  // 把 photoWidth/photoHeight CSS var 注入到 cell 上，
  // 让 react-photo-album 的 .react-photo-album--photo 宽度 calc 继续工作
  const cssVars = {
    "--react-photo-album--photo-width": width,
    "--react-photo-album--photo-height": height,
  } as React.CSSProperties;

  const cover = (
    <div
      className={`relative overflow-hidden bg-ink/5 ${isFilm ? "film-frame" : ""}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {/* Album 叠层：右下两层薄阴影模拟相册堆叠 */}
      {isAlbum && (
        <>
          <span aria-hidden className="absolute -bottom-1 -right-1 z-0 block h-full w-full bg-ink/15" />
          <span aria-hidden className="absolute -bottom-2 -right-2 z-0 block h-full w-full bg-ink/8" />
        </>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className={`cinema-tone relative z-[1] h-full w-full object-cover transition duration-700 ease-out ${
          isAlbum
            ? "group-hover:scale-[1.03] group-hover:[filter:brightness(0.7)_contrast(1.1)_saturate(0.85)]"
            : ""
        }`}
      />
      <span className="absolute left-4 top-4 z-[2] font-sans text-xs uppercase tracking-[0.24em] text-paper mix-blend-difference">
        No. {String(no + 1).padStart(2, "0")}
      </span>
      <span className="absolute right-4 top-4 z-[2] font-sans text-[10px] uppercase tracking-[0.24em] text-paper mix-blend-difference">
        {isAlbum ? `Album · ${String(photoCount).padStart(2, "0")}` : "Single Plate"}
      </span>
      {isFilm && filmStock && (
        <span className="absolute bottom-3 left-3 z-[3] flex items-center gap-2 border border-white/40 bg-black/55 px-2 py-1 font-sans text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-sm">
          <span>{filmStock}</span>
          {filmIso && (
            <span className="border-l border-white/40 pl-2 text-amber-300">ISO {filmIso}</span>
          )}
        </span>
      )}
    </div>
  );

  const meta = (
    <>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow truncate">
            {work.series} — {work.date.slice(0, 4)}
          </p>
          <h3 className="mt-1 font-sans text-lg leading-tight md:text-xl">{work.title}</h3>
        </div>
        {isAlbum && (
          <span className="hidden font-sans text-[10px] uppercase tracking-[0.18em] text-muted group-hover:text-accent md:inline">
            View →
          </span>
        )}
      </div>
      {work.deck && (
        <p className="mt-1 line-clamp-2 font-sans text-sm italic text-muted">{work.deck}</p>
      )}
    </>
  );

  if (isAlbum) {
    return (
      <Link
        key={work.slug}
        href={`/works/${work.slug}`}
        className="react-photo-album--photo group block"
        style={cssVars}
      >
        {cover}
        {meta}
      </Link>
    );
  }

  return (
    <div
      key={work.slug}
      className="react-photo-album--photo block cursor-default"
      style={cssVars}
    >
      {cover}
      {meta}
    </div>
  );
};
