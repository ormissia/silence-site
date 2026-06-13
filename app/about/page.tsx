import Image from "next/image";

export const metadata = {
  title: "About — SILENCE",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-32 md:px-10 md:pt-40">
      <div className="grid grid-cols-12 gap-x-8 gap-y-12 border-b border-rule pb-24">
        <div className="col-span-12 md:col-span-5">
          <div className="relative aspect-square overflow-hidden bg-ink/5">
            <Image
              src="/images/avatar.jpg"
              alt="Self portrait"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 40vw, 100vw"
              priority
            />
          </div>
          <p className="mt-3 font-sans text-xs uppercase tracking-[0.18em] text-muted">
            Self portrait, near Mount Gongga, 2025
          </p>
        </div>

        <div className="col-span-12 md:col-span-7 md:pt-8">
          <p className="eyebrow">About</p>
          <h1 className="mt-3 font-sans text-display leading-[0.95]">
            Hi, I&apos;m <span className="italic text-accent">Song.</span>
          </h1>

          <p className="drop-cap mt-10 max-w-column font-sans text-lede leading-relaxed">
            这里收着我从 2024 年起拿得出手的几组瞬间——
            <span className="italic">风光</span>是行走的回礼，
            <span className="italic">人像</span>是与陌生人交换的三秒钟，
            <span className="italic">日常</span>是被路过的物件，
            <span className="italic">胶片</span>则是我学着对“现在”按一次快门、不再回看的练习。
          </p>

          <p className="mt-6 max-w-column font-sans text-lede leading-relaxed">
            最近在德国古典哲学里待得最久——
            康德把“人”放进了一个倔强的位置：
            <span className="italic">人是目的，永远不只是手段。</span>
            这句话我一直记得，也尝试用它衡量自己每天的工作与镜头。
            读书笔记里那些划线，是我用别人的句子，给自己留的借据。
          </p>

          <p className="mt-6 max-w-column font-sans text-lede leading-relaxed">
            相机是借口，散步才是正事；划线是借口，重新决定如何活着才是正事。
            如果你也在某个安静的时刻被光打动过，或者被某一句话留住过，欢迎写信来——我都会回。
          </p>

          <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 font-sans text-sm md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Based in</p>
              <p className="mt-1">Beijing / Chengdu</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Cameras</p>
              <p className="mt-1">SONY A1II · Hasselblad X2D · FUJI GSW960</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Film Stock</p>
              <p className="mt-1">Kodak Portra 400 · Fuji Velvia 100</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Reading</p>
              <p className="mt-1">康德 · 黑格尔 · 黑塞 · 毛姆</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Off-screen</p>
              <p className="mt-1">Reading · Hiking</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Print &amp; Press</p>
              <p className="mt-1">Available on request</p>
            </div>
          </div>
        </div>
      </div>

      {/* 第二屏：站点导览 */}
      <div className="grid grid-cols-12 gap-x-8 gap-y-12 pb-24 pt-20">
        <div className="col-span-12 md:col-span-4">
          <p className="eyebrow">Around the Site</p>
          <h2 className="mt-3 font-sans text-headline">
            How to <span className="italic">read</span> this place.
          </h2>
        </div>

        <div className="col-span-12 grid grid-cols-1 gap-x-8 gap-y-10 md:col-span-8 md:grid-cols-2">
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
    <a href={href} className="group block border-t border-rule/60 pt-6">
      <p className="eyebrow group-hover:text-accent">
        {label} <span className="text-muted">/ {zh}</span>
      </p>
      <p className="mt-3 max-w-prose font-sans text-base leading-relaxed text-ink/85">
        {blurb}
      </p>
      <span className="mt-4 inline-block font-sans text-xs uppercase tracking-[0.18em] text-muted group-hover:text-accent">
        Visit →
      </span>
    </a>
  );
}
