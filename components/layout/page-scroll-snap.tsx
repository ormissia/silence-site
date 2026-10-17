"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useScrollSnap, type ScrollSnapPoint } from "./use-scroll-snap";

const FOOTER: readonly ScrollSnapPoint[] = [
  { selector: "[data-footer-snap-point]", align: "end", priority: 1 },
];
const HOME: readonly ScrollSnapPoint[] = [
  { selector: ".home-hero-snap-point" },
  { selector: "[data-home-snap-point='works'], [data-home-snap-point='highlight']", gap: 32 },
  { selector: "[data-home-snap-point='reading']" },
  ...FOOTER,
];
const ABOUT: readonly ScrollSnapPoint[] = [
  0,
  { selector: "[data-about-snap-point='scene-end']", align: "end" },
  { selector: "[data-about-snap-point='guide']", gap: 32 },
  ...FOOTER,
];

function ActiveScrollSnap({ pathname }: { pathname: string | null }) {
  useScrollSnap({
    points: pathname === "/" ? HOME : pathname === "/about" ? ABOUT : FOOTER,
    minHeight: pathname === "/about" ? 720 : 640,
    disabledSelector: ".home-splash",
  });
  return null;
}

export function PageScrollSnap() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  // 列表筛选和详情返回也要清掉上一页的滚动意图。
  return <ActiveScrollSnap key={`${pathname}?${search}`} pathname={pathname} />;
}
