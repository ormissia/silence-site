"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, useMotionTemplate, type MotionValue } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { CAMERA, lcdCenter } from "@/components/camera-spec";
import type { Work } from "@/lib/works";

/**
 * 电影感序章。
 * - 容器高 300vh，内层 sticky 钉住
 * - 相机模型在屏幕中央随滚动 scale 放大，最终 LCD 取景器恰好占满屏
 * - 左右两侧白色文案纵向滚入
 * - prefers-reduced-motion 用户得到静态版（无 scale，无 sticky）
 */
export function CinemaHero({ work }: { work: Work }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const search = useSearchParams();
  const debugLcd =
    search?.get("debugLcd") === "1" || process.env.NEXT_PUBLIC_DEBUG_LCD === "1";

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // 相机推近：1 → 9，前 50% 平滑指数加速到 9（每段速率比上段快 ~1.5x，无突变）
  // hold 段缓慢继续推（9 → 9.6），让滚动有反馈但画面几乎不变
  const cameraScale = useTransform(
    scrollYProgress,
    [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.85, 1],
    [1, 1.15, 1.5, 2.3, 4, 9, 9.4, 9.6],
  );
  // 相机外壳更早淡出
  const shellOpacity = useTransform(scrollYProgress, [0.42, 0.5], [1, 0]);
  // 全屏前景 bg：相机淡出阶段同步淡入
  const fgBgOpacity = useTransform(scrollYProgress, [0.46, 0.55], [0, 1]);
  // 全屏 bg 在 hold 段缓慢推近 + 加深 vignette，制造"还在前进"的微反馈
  const fgBgScale = useTransform(scrollYProgress, [0.46, 1], [1.15, 1.05]);
  const fgVignette = useTransform(scrollYProgress, [0.5, 1], [0, 0.5]);
  // Hold 段中央 reveal 标题：bg 落定后揭开，揭开后保持，跟随 sticky 解除自然滚出屏幕
  const titleRevealOpacity = useTransform(scrollYProgress, [0.55, 0.7], [0, 1]);
  const titleRevealBlur = useTransform(scrollYProgress, [0.55, 0.72], [12, 0]);
  const titleRevealY = useTransform(scrollYProgress, [0.55, 0.72], [40, 0]);
  const titleRevealLetter = useTransform(scrollYProgress, [0.55, 0.72, 1], [0.4, 0.32, 0.5]);
  const titleRevealFilter = useMotionTemplate`blur(${titleRevealBlur}px)`;
  const titleRevealLetterCss = useMotionTemplate`${titleRevealLetter}em`;
  // 整场不再淡出，靠 sticky 容器到底后自然滚出屏幕，让标题/背景一起被推走
  const sceneOpacity = useTransform(scrollYProgress, [0, 1], [1, 1]);

  // 左侧文案：从下方滚入，再向上推走（在切到 fg 之前结束）
  const leftY = useTransform(scrollYProgress, [0.05, 0.22, 0.4], [120, 0, -160]);
  const leftOpacity = useTransform(scrollYProgress, [0.05, 0.12, 0.3, 0.4], [0, 1, 1, 0]);

  // 右侧文案：晚一拍出现
  const rightY = useTransform(scrollYProgress, [0.1, 0.28, 0.45], [140, 0, -140]);
  const rightOpacity = useTransform(scrollYProgress, [0.1, 0.2, 0.35, 0.45], [0, 1, 1, 0]);

  // 标题渐隐（hero 底部那行 display 字）
  const titleOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);

  if (reduced) {
    return <CinemaHeroStatic work={work} />;
  }

  return (
    <section ref={ref} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-paper">
        {/* 工作室底图：用 CSS background 绕开 next/image 优化器，避免 dev 下大图加载失败 */}
        <motion.div className="absolute inset-0" style={{ opacity: sceneOpacity }}>
          <div
            className="cinema-tone-soft absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/background.jpg')" }}
          />
          {/* 暗角单独一层，不受 cinema-tone 滤镜影响 */}
          <div className="vignette absolute inset-0" />
        </motion.div>

        {/* 相机模型：scale 时以 LCD 中心为原点，LCD 钻进 viewport */}
        <div className="pointer-events-none absolute left-[60%] top-[55%] z-10 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            style={{
              scale: cameraScale,
              transformOrigin: lcdCenter(),
            }}
            className="will-change-transform"
          >
            <CameraBody shellOpacity={shellOpacity} debugLcd={debugLcd} />
          </motion.div>
        </div>

        {/* 全屏前景：相机淡出时这层同步淡入。
            原始尺寸图 + 100vw/100vh 容器，永远 1:1 像素匹配，不糊不超屏。
            hold 段还在轻微 zoom + vignette 加深，制造"还在前进"的粘滞反馈。 */}
        <motion.div
          aria-hidden
          style={{ opacity: fgBgOpacity, scale: fgBgScale }}
          className="pointer-events-none absolute inset-0 z-[15] will-change-transform"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/background.jpg"
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
          {/* hold 段渐深的暗角，让画面"沉下去"的感觉更足 */}
          <motion.div
            aria-hidden
            style={{ opacity: fgVignette }}
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)]" />
          </motion.div>
        </motion.div>

        {/* Hold 段中央标题：从模糊揭开，hold 期间字距缓慢撑开，制造"沉浸入定"感 */}
        <motion.div
          style={{ opacity: titleRevealOpacity }}
          className="pointer-events-none absolute inset-0 z-[18] flex flex-col items-center justify-center pb-[10vh]"
        >
          <motion.h2
            style={{
              filter: titleRevealFilter,        // 揭开时模糊 12px → 0
              y: titleRevealY,                  // 揭开时从下方 40px 升起
              letterSpacing: titleRevealLetterCss, // hold 段字距缓慢撑开（呼吸感）
            }}
            className={[
              "text-center",
              "font-sans",
              "text-display",
              "font-light",
              "leading-[1.4]",
              "text-ink",
              "[text-shadow:0_1px_8px_rgba(0,0,0,0.7)]",
            ].join(" ")}
          >
            这是一场回忆
            <br />
            还是一场梦
            <br />
            我不知道
          </motion.h2>
        </motion.div>

        {/* 左右文案 */}
        <div className="pointer-events-none absolute inset-0 z-20 mx-auto flex max-w-[1400px] items-center justify-between px-6 md:px-10">
          <motion.div
            style={{ y: leftY, opacity: leftOpacity }}
            className="pointer-events-auto max-w-[18rem] md:max-w-xs"
          >
            <h2 className="mt-4 font-sans text-headline leading-tight">
              这里是<br />
              <span className="italic text-accent">寂静无声。</span>
            </h2>
            <p className="mt-6 font-sans text-xl leading-relaxed text-ink/70">
              一个收着光、句子
              <br />与几次远行的小房间。
            </p>
            <ul className="mt-8 space-y-2 font-sans text-lg text-ink/60">
              <li>从 一次按下的快门、</li>
              <li>到一句被划下的话、</li>
              <li>偶尔写下的几行字，</li>
              <li>慢慢攒成现在的样子。</li>
            </ul>
          </motion.div>

          <motion.div
            style={{ y: rightY, opacity: rightOpacity }}
            className="pointer-events-auto hidden max-w-[20rem] text-right md:block"
          >
            <p className="font-sans text-xl leading-relaxed md:text-2xl">
              如果记忆不好，
              <br />旅途中的景色大概很快就会忘记，
            </p>
            <p className="mt-8 font-sans text-xl leading-relaxed text-ink/70 md:text-2xl">
              而摄影，
              <br />让这份
              <span className="italic text-accent">记忆</span>历久弥新。
            </p>
          </motion.div>
        </div>

        {/* hero 底部标题（仅标题，跟随相机推近一起淡出） */}
        <motion.div
          style={{ opacity: titleOpacity }}
          className="absolute bottom-0 left-0 right-0 z-30 mx-auto max-w-[1400px] px-6 pb-10 md:px-10 md:pb-14"
        >
          <div className="flex items-end justify-between gap-6">
            <h1 className="font-serif text-headline leading-[0.95]">
              The Place
              <br />Where <span className="italic text-accent">Works</span> Begin.
            </h1>
          </div>
          {/* TODO: 同上，location 跟最新作品挂钩与背景图语义不符，先注释。
          <div className="mt-8 flex items-center justify-end font-sans text-annotation uppercase tracking-[0.32em] text-muted">
            <span>Plate No. 01 — {work.location}</span>
          </div>
          */}
        </motion.div>

        {/* Enter the Works 按钮：相机放大消失之后才揭开（跟中央标题同步），放在屏幕右下角 */}
        <motion.div
          style={{ opacity: titleRevealOpacity, y: titleRevealY }}
          className="pointer-events-auto absolute bottom-10 right-6 z-30 md:bottom-14 md:right-10"
        >
          <Link
            href="/works"
            className="inline-flex items-center gap-3 rounded-lg border border-white/40 bg-white/5 px-6 py-3 font-sans text-label uppercase tracking-[0.24em] text-white backdrop-blur-sm transition hover:scale-105 hover:border-ink/60 hover:text-accent"
          >
            Enter the Works <span aria-hidden>→</span>
          </Link>
        </motion.div>

        {/* 底部中央滚动提示：跳动动效 + 跟随标题一起渐隐 */}
        {/* pointer-events-none：容器是 inset-x-0 全宽条，否则会盖住右下角的 Enter the Works 按钮 */}
        <motion.div
          aria-hidden
          style={{ opacity: titleOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex flex-col items-center gap-3"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 1.6,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 1.4,  // 每跳完停 1.4 秒，"时不时"而非持续
            }}
            className="flex flex-col items-center gap-3"
          >
            <span className="font-sans text-label uppercase tracking-[0.32em] text-ink/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
              Scroll · 向下滚动
            </span>
            {/* 一条细线 + 小箭头点缀，电影感引导 */}
            <span aria-hidden className="block h-10 w-px bg-ink/70" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * 相机本体：
 * - 容器 aspect-ratio 跟随 CAMERA.aspect，换图后自动适配
 * - LCD 嵌 background.jpg，跟外层 motion 一起放大
 * - LCD 用 <img> 而非 background-image：浏览器保留原始 source，scale 时按需重新光栅化，避免糊
 * - 相机外壳 PNG 随滚动淡出，露出"屏幕里的世界"
 */
function CameraBody({
  shellOpacity,
  debugLcd,
}: {
  shellOpacity: MotionValue<number>;
  debugLcd?: boolean;
}) {
  return (
    <div
      className="relative w-[min(60vh,48vw)] max-w-[720px]"
      style={{ aspectRatio: String(CAMERA.aspect) }}
    >
      {/* 底座阴影 */}
      <motion.div
        aria-hidden
        style={{ opacity: shellOpacity }}
        className="pointer-events-none absolute -inset-x-[6%] -bottom-[6%] top-[40%] -z-10 blur-2xl"
      >
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 75%)",
          }}
        />
      </motion.div>

      {/* LCD 槽位：嵌一张 background 让"屏幕通电"。
          它最终会被全屏前景层覆盖，所以即使 scale 中段略糊也看不到。 */}
      <div className="absolute overflow-hidden" style={CAMERA.lcd}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/background.jpg"
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
        {/* LCD 微反光 + 跟外壳一起淡出 */}
        <motion.div
          style={{ opacity: shellOpacity }}
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-black/10"
        />
      </div>

      {/* 相机外壳 —— 单独一层，淡出后只剩 LCD */}
      <motion.div style={{ opacity: shellOpacity }} className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={CAMERA.src}
          alt=""
          className="pointer-events-none h-full w-full object-contain"
          draggable={false}
        />
      </motion.div>

      {/* 调试模式：URL 加 ?debugLcd=1 显示 LCD 槽位描边 */}
      {debugLcd && (
        <div
          className="pointer-events-none absolute z-50 ring-2 ring-red-500"
          style={CAMERA.lcd}
        >
          <span className="absolute -top-6 left-0 bg-red-500 px-2 py-0.5 font-sans text-annotation uppercase tracking-widest text-white">
            LCD {CAMERA.lcd.left} / {CAMERA.lcd.top} / {CAMERA.lcd.width} / {CAMERA.lcd.height}
          </span>
        </div>
      )}
    </div>
  );
}

/** reduced-motion 静态版 */
function CinemaHeroStatic({ work }: { work: Work }) {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-paper">
      <div
        className="cinema-tone-soft absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/background.jpg')" }}
      />
      <div className="vignette absolute inset-0" />
      <div className="absolute inset-0 z-10 mx-auto flex max-w-[1400px] flex-col justify-end px-6 pb-16 md:px-10">
        <h1 className="mt-4 font-serif text-display">
          The Place Where <span className="italic text-accent">Works</span> Begin.
        </h1>
      </div>
    </section>
  );
}
