"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";

type SphereBook = {
  slug: string;
  title: string;
  author?: string;
  cover?: string;
};

/**
 * Fibonacci sphere：把 N 个点近似均匀地撒在单位球面上。
 * 比随机散点更整齐——任意旋转角度下肉眼都看不到"扎堆"或"裸缝"。
 */
function fibonacciSphere(n: number): Array<{ x: number; y: number; z: number }> {
  const out: Array<{ x: number; y: number; z: number }> = [];
  const golden = Math.PI * (3 - Math.sqrt(5)); // ~2.39996，黄金角弧度
  for (let i = 0; i < n; i++) {
    // y 从 1 到 -1 等距铺
    const y = 1 - (i / (n - 1 || 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    out.push({ x, y, z });
  }
  return out;
}

export function BookSphere({
  books,
  radius = 280,
  size = 64,
}: {
  books: SphereBook[];
  /** 球的半径（px），决定整体大小 */
  radius?: number;
  /** 单张书封面的宽（px） */
  size?: number;
}) {
  // 限制书数：太多会糊成一团；太少看不出球——25-50 是甜区
  const sliced = useMemo(() => books.filter((b) => b.cover).slice(0, 50), [books]);
  const points = useMemo(() => fibonacciSphere(sliced.length), [sliced.length]);

  // 鼠标位置 → 叠加在自转之上的方向偏移
  // 鼠标即使不在容器内，球也会持续自转——光标进入后才方向偏移
  const mouseX = useMotionValue(0); // -0.5 ~ 0.5
  const mouseY = useMotionValue(0);
  const autoYaw = useMotionValue(0);

  // 目标 yaw = 持续自转 + 鼠标位置偏移；目标 pitch = 鼠标 Y
  const targetYaw = useTransform(
    [mouseX, autoYaw] as const,
    ([mx, auto]: number[]) => auto + mx * 80 // ±40° 范围
  );
  const targetPitch = useTransform(mouseY, (my) => -my * 40); // ±20°

  const yaw = useSpring(targetYaw, { stiffness: 50, damping: 20, mass: 0.6 });
  const pitch = useSpring(targetPitch, { stiffness: 50, damping: 20, mass: 0.6 });

  const containerRef = useRef<HTMLDivElement>(null);

  // 自转 loop —— 永久跑，速率不随 hover 改变
  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const tick = (t: number) => {
      const dt = (t - prev) / 1000;
      prev = t;
      autoYaw.set(autoYaw.get() + 6 * dt); // 6°/s 持续自转
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoYaw]);

  // 鼠标移动归一化到 -0.5~0.5
  const onMouseMove = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onMouseLeave = () => {
    // 鼠标离开后偏移回到 0，自转继续
    mouseX.set(0);
    mouseY.set(0);
  };

  // 容器 perspective + transform
  const transform = useTransform(
    [yaw, pitch] as const,
    ([y, p]: number[]) => `rotateX(${p}deg) rotateY(${y}deg)`
  );

  if (sliced.length === 0) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative mx-auto flex items-center justify-center"
      style={{
        perspective: "1200px",
        height: radius * 2.4,
        width: radius * 2.4,
        maxWidth: "100%",
      }}
    >
      <motion.div
        className="relative"
        style={{
          transformStyle: "preserve-3d",
          width: 0,
          height: 0,
          transform,
        }}
      >
        {sliced.map((book, i) => (
          <SphereItem
            key={book.slug}
            book={book}
            point={points[i]}
            radius={radius}
            size={size}
            yaw={yaw}
            pitch={pitch}
          />
        ))}
      </motion.div>
    </div>
  );
}

/**
 * 单本书：放到球面位置，并反向旋转使图片始终面向屏幕（billboard 效果）。
 * z-index 由旋转后的世界 z 实时驱动，靠前的封面盖住其他。
 */
function SphereItem({
  book,
  point,
  radius,
  size,
  yaw,
  pitch,
}: {
  book: SphereBook;
  point: { x: number; y: number; z: number };
  radius: number;
  size: number;
  yaw: ReturnType<typeof useSpring>;
  pitch: ReturnType<typeof useSpring>;
}) {
  // 本地坐标（球面点 × 半径）
  const localX = point.x * radius;
  const localY = point.y * radius;
  const localZ = point.z * radius;

  // 反向旋转 + translate3d 让图片面向相机；同时计算世界 z 用于 z-index 与缩放
  const worldZ = useTransform([yaw, pitch] as const, ([y, p]: number[]) => {
    const yr = (y * Math.PI) / 180;
    const pr = (p * Math.PI) / 180;
    // 先绕 X（pitch）后绕 Y（yaw）—— 与外层 transform 顺序保持一致
    const cy = Math.cos(yr);
    const sy = Math.sin(yr);
    const cp = Math.cos(pr);
    const sp = Math.sin(pr);
    // pitch
    const x1 = point.x;
    const y1 = point.y * cp - point.z * sp;
    const z1 = point.y * sp + point.z * cp;
    // yaw
    const z2 = -x1 * sy + z1 * cy;
    return z2;
  });

  const zIndex = useTransform(worldZ, (z) => Math.round((z + 1) * 1000));
  // 离屏幕越近越亮、越大；越远越暗、越小——纵深感拉强
  const opacity = useTransform(worldZ, [-1, 0, 1], [0.2, 0.55, 1]);
  const scaleVal = useTransform(worldZ, [-1, 0, 1], [0.4, 0.8, 1.3]);

  // ⚠️ framer-motion 的 transform 字符串会"吃掉" scale 这个 motion prop。
  // 必须把 scale 也拼进字符串才能生效——这就是 scale 单独写没反应的根因。
  const itemTransform = useTransform(
    [yaw, pitch, scaleVal] as const,
    ([y, p, s]: number[]) =>
      `translate3d(${localX}px, ${localY}px, ${localZ}px) rotateY(${-y}deg) rotateX(${-p}deg) scale(${s})`
  );

  return (
    <motion.div
      className="absolute"
      style={{
        left: -size / 2,
        top: -size / 2,
        width: size,
        height: size * 1.4, // 书的 5:7 大致比例
        transformStyle: "preserve-3d",
        transform: itemTransform,
        zIndex,
        opacity,
      }}
    >
      <Link
        href={`/reading/${book.slug}`}
        title={book.title + (book.author ? ` · ${book.author}` : "")}
        className="block h-full w-full overflow-hidden bg-ink/5 shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition hover:shadow-[0_12px_32px_rgba(200,149,107,0.4)]"
      >
        {book.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover}
            alt={book.title}
            className="h-full w-full object-cover"
            draggable={false}
            loading="lazy"
          />
        )}
      </Link>
    </motion.div>
  );
}
