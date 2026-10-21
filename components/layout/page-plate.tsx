import type { ReactNode } from "react";
import { RevealImage as Image, RevealImg } from "@/components/media/reveal-image";
import { PlateParallax } from "@/components/layout/plate-parallax";

/**
 * 一级页面的整幅图版：照片（或书封拼版）+ 西文标签与数量 + 四字标题 + 引导语。
 * 始终是暗色表面；导航在其上切换为暗色玻璃。照片在框内做视差位移。
 */
export function PagePlate({ label, count, countLabel, title, lede, image, children }: {
  /** 西文标签，如 "Works"。 */
  label: string;
  count?: number;
  /** 数量的读屏文字，如 "组作品"。 */
  countLabel?: string;
  /** 四字中文标题，作为页面 h1。 */
  title: string;
  lede?: ReactNode;
  /** 图版照片；与 children 二选一。 */
  image?: { src: string; position?: string };
  /** 自定义图版背景（如书封拼版）。 */
  children?: ReactNode;
}) {
  return (
    <section data-theme-surface="dark" data-header-photo className="plate" aria-labelledby="page-title">
      <div className="plate-media" aria-hidden="true">
        {image ? (
          <PlateParallax>
            <Image
              src={image.src}
              alt=""
              fill
              priority
              sizes="100vw"
              revealEffect="blur"
              className="cinema-tone-soft"
              style={{ objectPosition: image.position ?? "center 45%" }}
            />
          </PlateParallax>
        ) : children}
      </div>
      <div className="plate-body page-frame">
        <p className="latin-label plate-label">
          <span>{label}</span>
          {count !== undefined && (
            <span className="plate-count">
              {count}<span className="sr-only">{countLabel ?? ""}</span>
            </span>
          )}
        </p>
        <h1 id="page-title" className="plate-title title-cn text-display">{title}</h1>
        {lede && <p className="plate-lede text-lede">{lede}</p>}
      </div>
    </section>
  );
}

/** Reading 图版：最近读完的真实书封，静态拼版，不随机；与照片图版共用同一套视差。 */
export function CoverMosaic({ covers }: { covers: string[] }) {
  return (
    <PlateParallax>
      <div className="absolute inset-[-2%_-1%]">
      <div className="plate-mosaic">
        {covers.map((cover, index) => (
          <span key={`${cover}-${index}`}>
            <RevealImg src={cover} alt="" loading={index < 24 ? "eager" : "lazy"} decoding="async" draggable={false} />
          </span>
        ))}
      </div>
      </div>
      <div className="plate-veil" />
    </PlateParallax>
  );
}
