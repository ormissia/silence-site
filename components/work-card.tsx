import Image from "next/image";
import Link from "next/link";
import { buildSrc, presetSize } from "@/lib/oss";
import type { Work } from "@/lib/works";

type Variant = "tall" | "wide" | "square";

const ASPECT: Record<Variant, string> = {
  tall: "aspect-[4/5]",
  wide: "aspect-[16/10]",
  square: "aspect-square",
};

export function WorkCard({
  work,
  index,
  variant = "tall",
}: {
  work: Work;
  index: number;
  variant?: Variant;
}) {
  const { width, height } = presetSize("gridThumb");
  const isAlbum = work.photos.length > 1;
  const photoCount = work.photos.length;
  const isFilm = work.series === "胶片";

  // 胶片右上角型号 / ISO 标签：从 exif.film 抽出（如 "Portra 400" → 型号 + 数字部分作 ISO）
  const filmStock = work.exif?.film;
  const filmIso = filmStock ? /\b(\d{2,4})\b/.exec(filmStock)?.[1] : undefined;

  const cover = (
    <div
      className={`relative overflow-hidden bg-ink/5 ${ASPECT[variant]}`}
    >
      {/* Album 视觉：右下两层薄阴影模拟相册叠层 */}
      {isAlbum && (
        <>
          <span
            aria-hidden
            className="absolute -bottom-1 -right-1 z-0 block h-full w-full bg-ink/15"
          />
          <span
            aria-hidden
            className="absolute -bottom-2 -right-2 z-0 block h-full w-full bg-ink/8"
          />
        </>
      )}
      <Image
        src={buildSrc(work.cover, "gridThumb")}
        alt={work.title}
        width={width}
        height={height}
        className={`cinema-tone relative z-[1] h-full w-full object-cover transition duration-700 ease-out ${
          isAlbum
            ? "group-hover:scale-[1.03] group-hover:[filter:brightness(0.7)_contrast(1.1)_saturate(0.85)]"
            : ""
        }`}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      />
      <span className="absolute left-4 top-4 z-[2] font-sans text-xs uppercase tracking-[0.24em] text-paper mix-blend-difference">
        No. {String(index + 1).padStart(2, "0")}
      </span>
      <span className="absolute right-4 top-4 z-[2] font-sans text-[10px] uppercase tracking-[0.24em] text-paper mix-blend-difference">
        {isAlbum ? `Album · ${String(photoCount).padStart(2, "0")}` : "Single Plate"}
      </span>

      {/* 胶片标签：左下角胶卷型号 + ISO（stencil 字号 + 边框） */}
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
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <div>
          <p className="eyebrow">
            {work.series} — {work.date.slice(0, 4)}
          </p>
          <h3 className="mt-1 font-sans text-2xl leading-tight md:text-3xl">
            {work.title}
          </h3>
        </div>
        {isAlbum && (
          <span className="hidden font-sans text-xs uppercase tracking-[0.18em] text-muted group-hover:text-accent md:inline">
            View →
          </span>
        )}
      </div>
      <p className="mt-2 max-w-prose font-sans text-base italic text-muted">{work.deck}</p>
    </>
  );

  if (isAlbum) {
    return (
      <Link href={`/works/${work.slug}`} className="group block">
        {cover}
        {meta}
      </Link>
    );
  }

  return (
    <div className="block cursor-default">
      {cover}
      {meta}
    </div>
  );
}
