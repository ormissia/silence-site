"use client";

import type { CSSProperties } from "react";
import { RevealImg } from "@/components/media/reveal-image";
import { EnterListLink } from "@/components/layout/list-return";
import { CoverFocusFrame } from "@/components/cover-focus-frame";
import { CoverParallaxTile } from "./work/cover-parallax-tile";
import { buildSrc } from "@/lib/oss";
import { formatWorkMonth, parseFilmRoll } from "@/lib/works/format";
import type { WorkSummary } from "@/lib/works/types";
import styles from "./work/works-index.module.css";
import hoverStyles from "./cover-hover.module.css";
import { useCoverReveal } from "./work/use-cover-reveal";
import { beginCoverTransition } from "./work/cover-transition";

export type WorkCardDensity = "feature" | "grid" | "sheet";

/** 没有探测到像素尺寸时的兜底比例。 */
const FALLBACK_RATIO: Record<WorkCardDensity, number> = { feature: 3 / 2, grid: 3 / 2, sheet: 4 / 3 };

export function WorkCard({ work, tab = "all", density = "grid" }: {
  work: WorkSummary; tab?: string; density?: WorkCardDensity;
}) {
  const coverRef = useCoverReveal(work.slug);
  const query = tab === "all" ? "" : `?tab=${encodeURIComponent(tab)}`;
  const film = density === "sheet" ? parseFilmRoll(work.title, work.slug) : null;
  const location = work.location !== "—" ? work.location : "";
  // 保持封面原始比例：优先使用构建期探测到的真实像素。
  const ratio = work.coverWidth && work.coverHeight
    ? work.coverWidth / work.coverHeight
    : FALLBACK_RATIO[density];

  return (
    <EnterListLink
      href={`/works/${work.slug}${query}`}
      listHref={`/works${query}`}
      className={`${styles.entry} ${hoverStyles.link}`}
      aria-labelledby={`work-title-${work.slug}`}
      data-work-entry
      data-density={density}
      onNavigate={() => { if (coverRef.current) beginCoverTransition(coverRef.current, work.slug); }}
    >
      <div ref={coverRef} data-work-cover className={`${styles.cover} ${hoverStyles.cover}`} style={{ "--cover-ratio": ratio } as CSSProperties}>
        <CoverParallaxTile>
          <RevealImg
            src={buildSrc(work.cover, "gridThumb")}
            alt=""
            width={work.coverWidth}
            height={work.coverHeight}
            loading="lazy"
            decoding="async"
            className={`${styles.image} ${hoverStyles.image}`}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        </CoverParallaxTile>

        {/* 信息压在图上；鼠标悬浮时淡出收起，键盘聚焦与触屏保持可见。 */}
        <div className={styles.overlay}>
          <p className={styles.overlayMeta}>
            <span>{film ? "胶片" : work.series}</span>
            {location && <span>{location}</span>}
          </p>
          {film ? (
            <h3 id={`work-title-${work.slug}`} className={styles.overlayTitle}>
              {film.roll ? <>
                <span className="sr-only">第 </span>
                <span className={styles.rollNumber}>{film.roll}</span>
                <span className="sr-only"> 卷，</span>
                <span>{film.stock}</span>
              </> : film.stock}
              {film.format && <span className={styles.format}>{film.format}</span>}
            </h3>
          ) : (
            <h3 id={`work-title-${work.slug}`} className={styles.overlayTitle}>{work.title}</h3>
          )}
          <p className={styles.overlayDate}>{formatWorkMonth(work.date)}</p>
        </div>

        <CoverFocusFrame />
      </div>
    </EnterListLink>
  );
}
