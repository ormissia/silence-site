import Image from "next/image";
import Link from "next/link";
import { SecondaryPageHeader } from "@/components/layout/secondary-page-header";

export const metadata = { title: "About — SILENCE" };

const facts = [
  ["Based in", "Beijing / Chengdu"],
  ["Cameras", "Sony A1M2 · Hasselblad X2D · FUJI GSW960"],
  ["Film stock", "Kodak Portra 400 · Fuji Velvia 100"],
  ["Reading", "康德 · 黑格尔 · 黑塞 · 毛姆"],
  ["Off-screen", "Reading · Hiking"],
  ["Print & press", "Available on request"],
];
const sections = [
  { href: "/works", label: "Works", zh: "作品", blurb: "风光、人像、日常、胶片——按系列归档的影集，每一组都是一次出门的复盘。" },
  { href: "/journal", label: "Journal", zh: "文章", blurb: "技术心得与生活随笔。代码不写诗，但写代码的人偶尔写。" },
  { href: "/reading", label: "Reading", zh: "读书笔记", blurb: "一本本读过的书，划过的句子。康德、黑格尔、海德格尔的脚印踩得最深。" },
  { href: "/works?tab=film", label: "Film", zh: "胶片", blurb: "36 张就是 36 张。胶卷把「再来一次」这件事彻底拿走。" },
];

const mountainNotes = [
  `我面前有一座山
它是年轻人的幻想，迷梦和欲望
多年来我一直梦到它
现在我要出发了
直到它，近在眼前
直到我，亲眼所见
我才真正被它的巨大和宏伟所震撼
它高耸入云，令人炫目
它覆盖着永恒的白雪和冰川
我们在它的面前是那么的微不足道
致命的吸引力让我们就像飞蛾扑火
飞向这座壮美的高山
而很多人的翅膀则在冰冷的山脊上燃烧殆尽
高山和我，都仿佛成为了我梦里的一部分`,
  `我们行走在生命的边缘
这个边缘，如此锋利
当我站在山顶时
我看见了无比壮丽的美景
幸好我最终活了下来
高山给我的奖励是
峰顶的美景令我终身难忘
为此，我心满意足...`,
];

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 pb-24 pt-28 md:px-12 md:pt-44">
      <SecondaryPageHeader
        eyebrow="About — Song"
        titleEn="ABOUT"
        titleZh="关于"
        lede={"我在代码里寻找秩序，在书页间追问命运\n走进群山，用镜头留下那些尚未来得及命名的光"}
      />

      <div className="mx-auto mt-16 max-w-[800px]">
        <div className="space-y-10 text-center font-serif text-[clamp(1rem,1.5vw,1.125rem)] leading-[2.05] tracking-[0.02em] text-ink/85">
          {mountainNotes.map((stanza) => (
            <p key={stanza.slice(0, 10)} className="whitespace-pre-line">{stanza}</p>
          ))}
        </div>
        <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3">
          {facts.map(([label, value]) => (
            <div key={label} className="border-t divider-gradient pt-5">
              <dt className="text-annotation uppercase tracking-[0.2em] text-muted">{label}</dt>
              <dd className="mt-3 text-label leading-relaxed tracking-normal text-ink/70">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-12 border-t divider-gradient pt-16 md:grid-cols-[3fr_2fr] lg:gap-20">
        <div>
          <h2 className="mb-6 font-serif text-3xl leading-tight">How to read this place.</h2>
          {sections.map(({ href, label, zh, blurb }) => (
            <Link key={href} href={href} className="group block border-t divider-gradient py-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-body">{label} <span className="mx-1 text-ink/25">/</span> <span className="text-sm text-muted">{zh}</span></h3>
                <span className="silence-pill !px-3 !py-1.5 !text-[10px] uppercase text-muted group-hover:text-ink">Visit →</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{blurb}</p>
            </Link>
          ))}
        </div>
        <div className="flex flex-col items-center gap-6 md:pt-2">
          <figure className="editorial-card w-3/4 max-w-sm">
            <div className="relative aspect-[4/3]"><Image src="/images/avatar.jpg" alt="Self portrait" fill sizes="(min-width: 768px) 25vw, 70vw" className="object-cover" /></div>
            <figcaption className="px-4 py-3 text-[9px] uppercase tracking-[0.2em] text-muted">Self portrait · Near Mount Gongga, 2025</figcaption>
          </figure>
          <p className="max-w-xs text-center text-xs leading-relaxed text-muted">如果被某一道光或某一句话留住过，欢迎写信来——我都会回。</p>
          <a href="mailto:ormissia@outlook.com" className="silence-pill silence-pill-accent px-6 py-3 text-ink shadow-[0_0_24px_rgba(124,108,240,0.18)]">WRITE TO ME →</a>
        </div>
      </div>
    </section>
  );
}
