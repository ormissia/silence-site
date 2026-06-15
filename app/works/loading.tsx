import { SecondaryPageHeader } from "@/components/layout/secondary-page-header";

/**
 * Works 列表 loading 骨架。OSS list 第一次冷启动 + image-meta 探测可能要几百 ms，
 * 慢网下空窗明显。复用 SecondaryPageHeader 让 header 即时出现，
 * 下方留一块 60vh 占位等真实 Gallery 接管。
 */
export default function WorksLoading() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-32 md:px-10 md:pt-40">
      <SecondaryPageHeader
        eyebrow="Index of Works — 2024 / Ongoing"
        titleEn="WORKS"
        titleZh="作品"
        lede="风光、人像、与日常之间的随手——按主题分门别类地翻看。"
      />
      <div
        className="mt-12 h-[60vh] border-b border-rule/60"
        aria-hidden
      />
    </section>
  );
}
