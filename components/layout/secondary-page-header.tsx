import { getAccentStyle } from "@/lib/accent";

const DESCRIPTIONS: Record<string, string> = {
  WORKS: "Selected photographs, collected along the way.",
  JOURNAL: "Small observations. Notes on work and life.",
  READING: "Books, marked passages, and unfinished conversations.",
  ABOUT: "A note on the person behind the camera.",
};

export function SecondaryPageHeader({ eyebrow, titleEn, titleZh, lede, count, tone = "page" }: {
  eyebrow: string; titleEn: string; titleZh: string; lede: string; count?: string;
  /** photo：压在整幅照片上，文字与胶囊切换为亮色。 */
  tone?: "page" | "photo";
}) {
  const photo = tone === "photo";
  return (
    <header className="pb-6 md:pb-9">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-5">
            <h1 className={`font-sans text-display font-normal capitalize leading-[1.1] tracking-[0.04em] ${photo ? "text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.5)]" : ""}`}>{titleEn.toLowerCase()}</h1>
            {count && <span className={`silence-pill ${photo ? "silence-pill-on-photo" : "text-muted"}`} style={getAccentStyle(`count:${titleEn}`)}><span className="h-1.5 w-1.5 rounded-full bg-gradient-accent" />{count}</span>}
          </div>
          <h2 className={`mt-4 text-body tracking-[0.08em] md:mt-5 ${photo ? "text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.55)]" : "text-ink"}`}>{titleZh}</h2>
          <p className={`mt-2 hidden font-serif text-base italic md:mt-4 md:block ${photo ? "text-white/75" : "text-muted"}`}>{DESCRIPTIONS[titleEn] ?? titleZh}</p>
        </div>
        <div className="max-w-sm md:text-right">
          <p className={`mb-4 hidden text-xs uppercase tracking-[0.12em] md:block ${photo ? "text-white/65" : "text-muted"}`}>{eyebrow}</p>
          <p className={`whitespace-pre-line text-sm leading-relaxed tracking-normal ${photo ? "text-white/85 [text-shadow:0_1px_10px_rgba(0,0,0,0.5)]" : "text-muted"}`}>{lede}</p>
        </div>
      </div>
    </header>
  );
}
