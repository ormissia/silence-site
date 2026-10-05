"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { useRouteProgress } from "./route-progress";
import { shouldStartRouteProgress } from "@/lib/route-navigation";

type Props = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children?: ReactNode;
  };

/**
 * 在点击时立即触发顶部进度条的 Link。
 * 先尊重调用方取消点击，再为实际改变 pathname/query 的同源普通点击启动进度。
 * 同页、锚点、新窗口和下载点击不启动；Next Link 继续负责实际导航。
 */
export function NavProgressLink({ onClick, children, ...rest }: Props) {
  const progress = useRouteProgress();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (shouldStartRouteProgress({
      href: e.currentTarget.href,
      currentHref: window.location.href,
      defaultPrevented: e.defaultPrevented,
      button: e.button,
      metaKey: e.metaKey,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      target: e.currentTarget.target,
      download: e.currentTarget.hasAttribute("download"),
    })) progress.start();
  };

  return (
    <Link {...rest} onClick={handleClick}>
      {children}
    </Link>
  );
}
