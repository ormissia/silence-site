import Image from "next/image";

export const metadata = {
  title: "About — SILENCE",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto max-w-[800px] border-b divider-gradient pb-16 text-center">


        <div className="">
          <p className="eyebrow">About</p>
          <h1 className="mt-3 font-serif text-headline leading-tight">
            Hi, I&apos;m Song.
          </h1>

          <p className="mt-8 mx-auto max-w-column font-sans text-body leading-[1.95] text-ink/75">
            这里收着我从 2024 年起拿得出手的几组瞬间——
            <span className="italic">风光</span>是行走的回礼，
            <span className="italic">人像</span>是与陌生人交换的三秒钟，
            <span className="italic">日常</span>是被路过的物件，
            <span className="italic">胶片</span>则是我学着对“现在”按一次快门、不再回看的练习。
          </p>

          <p className="mt-6 mx-auto max-w-column font-sans text-body leading-[1.95] text-ink/75">
            最近在德国古典哲学里待得最久——
            康德把“人”放进了一个倔强的位置：
            <span className="italic">人是目的，永远不只是手段。</span>
            这句话我一直记得，也尝试用它衡量自己每天的工作与镜头。
            读书笔记里那些划线，是我用别人的句子，给自己留的借据。
          </p>

          <p className="mt-6 mx-auto max-w-column font-sans text-body leading-[1.95] text-ink/75">
            相机是借口，散步才是正事；划线是借口，重新决定如何活着才是正事。
            如果你也在某个安静的时刻被光打动过，或者被某一句话留住过，欢迎写信来——我都会回。
          </p>

          <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 font-sans text-sm md:grid-cols-3">
            <div>
              <p className="text-caption uppercase tracking-[0.18em] text-muted">Based in</p>
              <p className="mt-1">Beijing / Chengdu</p>
            </div>
            <div>
              <p className="text-caption uppercase tracking-[0.18em] text-muted">Cameras</p>
              <p className="mt-1">Sony A1M2 · Hasselblad X2D · FUJI GSW960</p>
            </div>
            <div>
              <p className="text-caption uppercase tracking-[0.18em] text-muted">Film Stock</p>
              <p className="mt-1">Kodak Portra 400 · Fuji Velvia 100</p>
            </div>
            <div>
              <p className="text-caption uppercase tracking-[0.18em] text-muted">Reading</p>
              <p className="mt-1">康德 · 黑格尔 · 黑塞 · 毛姆</p>
            </div>
            <div>
              <p className="text-caption uppercase tracking-[0.18em] text-muted">Off-screen</p>
              <p className="mt-1">Reading · Hiking</p>
            </div>
            <div>
              <p className="text-caption uppercase tracking-[0.18em] text-muted">Print &amp; Press</p>
              <p className="mt-1">Available on request</p>
            </div>
          </div>
        </div>
      </div>

      {/* 第二屏：站点导览 */}
      <div className="grid grid-cols-1 gap-12 pb-24 pt-16 md:grid-cols-[3fr_2fr]">
        <div className="md:col-span-2">
          <p className="eyebrow">Around the Site</p>
          <h2 className="mt-3 font-sans text-headline">
            How to <span className="italic">read</span> this place.
          </h2>
        </div>

        <div className="flex flex-col gap-5">
          <SectionCard
            href="/works"
            label="Works"
            zh="作品"
            blurb="风光、人像、日常、胶片——按系列归档的影集，每一组都是一次出门的复盘。"
          />
          <SectionCard
            href="/journal"
            label="Journal"
            zh="文章"
            blurb="技术心得与生活随笔。代码不写诗，但写代码的人偶尔写。"
          />
          <SectionCard
            href="/reading"
            label="Reading"
            zh="读书笔记"
            blurb="一本本读过的书，划过的句子。康德、黑格尔、海德格尔的脚印踩得最深。"
          />
          <SectionCard
            href="/works?tab=film"
            label="Film"
            zh="胶片"
            blurb="36 张就是 36 张。胶卷把「再来一次」这件事彻底拿走。"
          />
        </div>
        <div className="flex flex-col items-center gap-6">
          <figure className="editorial-card w-2/3 max-w-sm">
            <div className="relative aspect-[4/3]"><Image src="/images/avatar.jpg" alt="Self portrait" fill sizes="(min-width: 768px) 25vw, 60vw" className="object-cover" /></div>
            <figcaption className="px-4 py-3 text-annotation uppercase tracking-widest text-muted">Near Mount Gongga, 2025</figcaption>
          </figure>
          <p className="max-w-xs text-center text-xs leading-relaxed text-muted">如果被某一道光或某一句话留住过，欢迎写信来。</p>
          <a href="mailto:ormissia@outlook.com" className="silence-pill text-ink" style={{ background: "linear-gradient(#0C0C0C,#0C0C0C) padding-box, var(--gradient-accent) border-box", borderColor: "transparent" }}>WRITE TO ME →</a>
        </div>
      </div>
    </section>
  );
}

function SectionCard({
  href,
  label,
  zh,
  blurb,
}: {
  href: string;
  label: string;
  zh: string;
  blurb: string;
}) {
  return (
    <a href={href} className="group block border-t divider-gradient pt-4">
      <p className="eyebrow group-hover:text-accent">
        {label} <span className="text-muted">/ {zh}</span>
      </p>
      <p className="mt-3 max-w-prose font-sans text-base leading-relaxed text-ink/85">
        {blurb}
      </p>
      <span className="mt-4 inline-block font-sans text-caption uppercase tracking-[0.18em] text-muted group-hover:text-accent">
        Visit →
      </span>
    </a>
  );
}
