"use client";

import type { CSSProperties } from "react";
import { RevealImg } from "@/components/media/reveal-image";
import { EnterListLink } from "@/components/layout/list-return";
import { CoverFocusFrame } from "@/components/cover-focus-frame";
import { buildSrc } from "@/lib/oss";
import type { WorkSummary } from "@/lib/works/types";
import styles from "./work/works-timeline.module.css";
import hoverStyles from "./cover-hover.module.css";

export function WorkCard({ work, index, tab = "all" }: {
  work: WorkSummary; index: number; tab?: string;
}) {
  const query = tab === "all" ? "" : `?tab=${encodeURIComponent(tab)}`;
  const coverStyle = work.coverWidth && work.coverHeight
    ? { "--cover-ratio": work.coverWidth / work.coverHeight } as CSSProperties
    : undefined;

  return (
    <EnterListLink
      href={`/works/${work.slug}${query}`}
      listHref={`/works${query}`}
      className={`${styles.entry} ${hoverStyles.link}`}
      aria-labelledby={`work-title-${work.slug}`}
    >
      <div className={styles.details}>
        <time dateTime={work.date} className={styles.date}>{work.date.replaceAll("-", ".")}</time>
        <h2 id={`work-title-${work.slug}`} className={styles.title}>{work.title}</h2>
        <p className={styles.metadata}>
          {[work.series, work.location !== "—" ? work.location : ""].filter(Boolean).join(" · ")}
        </p>
        {work.deck && <p className={styles.deck}>{work.deck}</p>}
      </div>
      <span className={styles.node} aria-hidden="true" />
      <div className={`${styles.cover} ${hoverStyles.cover}`} style={coverStyle}>
        <RevealImg
          revealIndex={index}
          src={buildSrc(work.cover, "gridThumb")}
          alt={work.title}
          width={work.coverWidth}
          height={work.coverHeight}
          loading="lazy"
          decoding="async"
          className={`${styles.image} ${hoverStyles.image}`}
        />
        <CoverFocusFrame />
      </div>
    </EnterListLink>
  );
}
