"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { CAMERA, lcdCenter } from "@/components/camera-spec";
import type { Work } from "@/lib/works";

const POEM_LINES = ["这是一场回忆，", "还是一场梦，", "我不知道。"];

function PoemLine({ text, index, progress }: {
  text: string;
  index: number;
  progress: MotionValue<number>;
}) {
  // 278vh 滚动行程：每隔 70vh 开始下一句，每句用 30vh 缓慢揭开。
  const start = (69 + index * 70) / 278;
  const end = start + 30 / 278;
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], ["40%", "0%"]);

  return (
    <span className="block overflow-hidden px-4 -mx-4">
      <motion.span className="about-hero-quote block" style={{ opacity, y }}>
        {text}
      </motion.span>
    </span>
  );
}

/**
 * 电影感序章。
 * - 容器高 378vh，内层 sticky 钉住，实际固定滚动行程为 278vh
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

  const { scrollYProgress: sceneProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  // 前 75vh 保持原有相机推近节奏，新增行程用于后半段诗句与停留。
  const scrollYProgress = useTransform(sceneProgress, [0, 75 / 278, 1], [0, 0.5, 1]);

  // 前段保持原推近节奏，40% 起平滑接到按视口计算的铺满尺寸。
  const cameraScale = useTransform(
    scrollYProgress,
    [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.85, 1],
    [1, 1.15, 1.5, 2.3, 4, 9, 9.4, 9.6],
  );
  // 按实际尺寸重绘照片，避免把初始 LCD 的低分辨率合成层放大。
  // 位移补偿保持原有以 LCD 中心为原点的推近轨迹。
  const [lcdX, lcdY] = lcdCenter().split(" ").map(parseFloat);
  const baseWidth = "min(60vh, 48vw, 720px)";
  const lcdWidth = parseFloat(CAMERA.lcd.width) / 100;
  const lcdHeight = parseFloat(CAMERA.lcd.height) / 100;
  // 同一张 LCD 照片推近至覆盖视口；不再交接给另一张全屏图片。
  const fitProgress = useTransform(scrollYProgress, [0.4, 0.5], [0, 1]);
  const cameraWidth = useTransform(() => {
    const fit = fitProgress.get();
    const zoom = Math.min(cameraScale.get(), 4);
    const hold = 1 + Math.max(0, scrollYProgress.get() - 0.5) * 0.08;
    const coverWidth = `max(100vw / ${lcdWidth}, 100vh * ${CAMERA.aspect / lcdHeight})`;
    return `calc(${baseWidth} * ${zoom * (1 - fit)} + ${coverWidth} * ${fit * hold})`;
  });
  const cameraLeft = useTransform(cameraWidth, (width) => `calc(${lcdX}% - ${width} * ${lcdX / 100})`);
  const cameraTop = useTransform(cameraWidth, (width) => `calc(${lcdY}% - ${width} * ${lcdY / 100 / CAMERA.aspect})`);
  // LCD 中心随推近移到视口中心，外壳和照片始终保持对齐。
  const anchorLeft = useTransform(fitProgress, (fit) =>
    `calc(${60 - 10 * fit}% + ${baseWidth} * ${(0.5 - lcdX / 100) * fit})`
  );
  const anchorTop = useTransform(fitProgress, (fit) =>
    `calc(${55 - 5 * fit}% + ${baseWidth} * ${(0.5 - lcdY / 100) / CAMERA.aspect * fit})`
  );

  // 相机外壳更早淡出
  const shellOpacity = useTransform(scrollYProgress, [0.42, 0.5], [1, 0]);
  // 原 LCD 照片成为背景后，仅叠加逐渐加深的暗角。
  const fgVignette = useTransform(scrollYProgress, [0.5, 1], [0, 0.5]);
  // 诗句在 239vh 时全部显示，最后 39vh 留给阅读。
  const poemShadeOpacity = useTransform(scrollYProgress, [0.42, 0.52], [0, 1]);
  // 整场不再淡出，靠 sticky 容器到底后自然滚出屏幕，让标题/背景一起被推走
  const sceneOpacity = useTransform(scrollYProgress, [0, 1], [1, 1]);

  // 左侧文案：从下方滚入，再向上推走（在照片铺满前结束）
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
    <section ref={ref} className="relative h-[378vh]">
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

        {/* 基准框只负责定位，内部照片按真实宽度推近并成为全屏背景。 */}
        <motion.div
          className="pointer-events-none absolute z-10 w-[min(60vh,48vw)] max-w-[720px] -translate-x-1/2 -translate-y-1/2"
          style={{ aspectRatio: String(CAMERA.aspect), left: anchorLeft, top: anchorTop }}
        >
          <motion.div
            style={{
              width: cameraWidth,
              left: cameraLeft,
              top: cameraTop,
            }}
            className="absolute"
          >
            <CameraBody shellOpacity={shellOpacity} debugLcd={debugLcd} />
          </motion.div>
        </motion.div>

        {/* 只覆盖暗角，背景始终是相机 LCD 中持续放大的那张照片。 */}
        <motion.div
          aria-hidden
          style={{ opacity: fgVignette }}
          className="pointer-events-none absolute inset-0 z-[15] bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)]"
        />

        {/* 固定三行占位，逐句揭开；回滚时沿相同进度收起。 */}
        <div
          className="pointer-events-none absolute inset-0 z-[18] flex flex-col items-center justify-center px-6 pb-[10vh]"
        >
          <motion.div
            aria-hidden
            style={{ opacity: poemShadeOpacity }}
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(10,10,11,0.45)_0%,transparent_65%)]"
          />
          <h2
            className="relative text-center font-sans text-headline font-normal leading-[1.65] tracking-[0.04em]"
          >
            {POEM_LINES.map((text, index) => (
              <PoemLine key={text} text={text} index={index} progress={sceneProgress} />
            ))}
          </h2>
        </div>

        {/* 左右文案 */}
        <motion.div
          aria-hidden
          style={{ opacity: leftOpacity }}
          className="pointer-events-none absolute inset-0 z-[19] bg-[linear-gradient(90deg,rgba(10,10,11,0.5)_0%,transparent_32%,transparent_72%,rgba(10,10,11,0.35)_100%)]"
        />
        <div className="pointer-events-none absolute inset-0 z-20 mx-auto flex max-w-[1400px] items-center justify-between px-6 md:px-10">
          <motion.div
            style={{ y: leftY, opacity: leftOpacity }}
            className="pointer-events-auto max-w-[18rem] font-sans font-normal [text-shadow:0_2px_16px_rgba(0,0,0,0.65)] md:max-w-xs"
          >
            <h2 className="text-headline font-normal leading-[1.35] tracking-[0.04em] text-ink">
              <span className="mb-3 block text-deck leading-relaxed tracking-[0.08em] text-ink/70">这里是</span>
              寂静无声。
            </h2>
            <p className="mt-6 text-body leading-[2] tracking-[0.025em] text-ink/85">
              一个收着光、句子
              <br />与几次远行的小房间。
            </p>
            <p className="mt-7 text-deck leading-[2.1] tracking-[0.025em] text-ink/70">
              从一次按下的快门、<br />
              到一句被划下的话、<br />
              偶尔写下的几行字，<br />
              慢慢攒成现在的样子。
            </p>
          </motion.div>

          <motion.div
            style={{ y: rightY, opacity: rightOpacity }}
            className="pointer-events-auto hidden max-w-[18rem] font-sans font-normal text-right [text-shadow:0_2px_16px_rgba(0,0,0,0.65)] md:block"
          >
            <p className="text-body leading-[2.1] tracking-[0.025em] text-ink/75">
              如果记忆不好，
              <br />旅途中的景色
              <br />大概很快就会忘记，
            </p>
            <p className="mt-7 text-body leading-[2.1] tracking-[0.025em] text-ink/90">
              而摄影，
              <br />让这份
              <span className="text-accent">记忆</span>历久弥新。
            </p>
          </motion.div>
        </div>

        {/* hero 底部标题（仅标题，跟随相机推近一起淡出） */}
        <motion.div
          style={{ opacity: titleOpacity }}
          className="absolute bottom-0 left-0 right-0 z-30 mx-auto max-w-[1400px] px-6 pb-32 md:px-10 md:pb-14"
        >
          <OpeningTitle />
          {/* TODO: 同上，location 跟最新作品挂钩与背景图语义不符，先注释。
          <div className="mt-8 flex items-center justify-end font-sans text-annotation uppercase tracking-[0.32em] text-muted">
            <span>Plate No. 01 — {work.location}</span>
          </div>
          */}
        </motion.div>

        {/* 底部中央滚动提示：跳动动效 + 跟随标题一起渐隐 */}
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
            <span className="font-sans text-caption uppercase text-ink/70 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
              Scroll · 向下滚动
            </span>
            {/* 一条细线 + 小箭头点缀，电影感引导 */}
            <span aria-hidden className="block h-10 w-px bg-ink/70" />
          </motion.div>
        </motion.div>
      </div>
      {/* 跟随序章底边进入视口，不占用诗句的 sticky 停留行程。 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-[30vh] bg-gradient-to-b from-transparent via-paper/60 to-paper"
      />
    </section>
  );
}

/**
 * 相机本体：
 * - 容器 aspect-ratio 跟随 CAMERA.aspect，换图后自动适配
 * - LCD 嵌 background.jpg，随容器实际尺寸重绘
 * - 照片不经过父级 scale / will-change 合成层，保留推近时的细节
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
      className="relative w-full"
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

      {/* LCD 槽位随相机尺寸变化，始终从原图按当前显示尺寸绘制。 */}
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[30vh] bg-gradient-to-b from-transparent via-paper/60 to-paper"
      />
      <div className="absolute inset-0 z-10 mx-auto flex max-w-[1400px] flex-col justify-end px-6 pb-16 md:px-10">
        <OpeningTitle />
      </div>
    </section>
  );
}

/** 动态序章与减弱动态模式共用同一套封面文字。 */
function OpeningTitle() {
  return (
    <div className="max-w-xl font-sans text-ink [text-shadow:0_2px_20px_rgba(0,0,0,0.5)]">
      <p className="text-caption uppercase text-ink/70">Photographs &amp; Notes</p>
      <h1 className="mt-4 text-display font-normal leading-[1.2] tracking-[0.04em]">寂静无声</h1>
      <p className="mt-6 text-body leading-relaxed tracking-[0.025em] text-ink/80">收着光、句子与几次远行。</p>
    </div>
  );
}
