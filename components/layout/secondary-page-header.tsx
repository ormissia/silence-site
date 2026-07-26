/**
 * 二级页（works / journal / reading）共用的页面头：
 * eyebrow + 大标题（英文 / 斜体中文）+ 中文 lede。
 *
 * 三页结构原本字面级一致，抽出来防止后续改动出现漂移。
 */
export function SecondaryPageHeader({
  eyebrow,
  titleEn,
  titleZh,
  lede,
}: {
  eyebrow: string;
  titleEn: string;
  titleZh: string;
  lede: string;
}) {
  return (
    <header className="border-b divider-gradient pb-10">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 font-serif text-display">
        {titleEn} <span className="text-muted">/</span>{" "}
        <span className="italic">{titleZh}</span>
      </h1>
      <p className="mt-6 max-w-column font-sans text-lede text-ink/80">{lede}</p>
    </header>
  );
}
