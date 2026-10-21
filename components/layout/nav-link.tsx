"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { useRouteProgress } from "./route-progress-state";
import { shouldStartRouteProgress } from "@/lib/route-navigation";
import { getAccentStyle } from "@/lib/accent";

export type NavProgressLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children?: ReactNode;
    /** 仅在未取消的同窗口路由跳转前执行；不接管浏览器导航。 */
    onNavigate?: () => void;
  };

/**
 * 在点击时立即触发顶部进度条的 Link。
 * 先尊重调用方取消点击，再为实际改变 pathname/query 的同源普通点击启动进度。
 * 同页、锚点、新窗口和下载点击不启动；Next Link 继续负责实际导航。
 */
export function useNavProgressClick({ onClick, onNavigate }: Pick<NavProgressLinkProps, "onClick" | "onNavigate">) {
  const progress = useRouteProgress();

  return (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (shouldStartRouteProgress({
      // SVG anchors expose animated href/target values rather than strings.
      href: typeof e.currentTarget.href === "string" ? e.currentTarget.href : e.currentTarget.getAttribute("href") ?? "",
      currentHref: window.location.href,
      defaultPrevented: e.defaultPrevented,
      button: e.button,
      metaKey: e.metaKey,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      target: e.currentTarget.getAttribute("target") ?? "",
      download: e.currentTarget.hasAttribute("download"),
    })) {
      onNavigate?.();
      progress.start();
    }
  };
}

export function NavProgressLink({ onClick, onNavigate, children, style, ...rest }: NavProgressLinkProps) {
  const handleClick = useNavProgressClick({ onClick, onNavigate });
  const accentStyle = rest.className?.includes("silence-pill")
    ? getAccentStyle(`link:${typeof rest.href === "string" ? rest.href : rest.href.pathname}`)
    : undefined;
  return (
    <Link {...rest} style={accentStyle ? { ...accentStyle, ...style } : style} onClick={handleClick}>
      {children}
    </Link>
  );
}
