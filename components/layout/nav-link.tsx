"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { useRouteProgress } from "./route-progress";

type Props = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children?: ReactNode;
  };

/**
 * 在点击时立即触发顶部进度条的 Link。
 * 行为与 next/link 完全一致——只在 click handler 多一步 routeProgress.start()。
 *
 * 何时同 origin & 同 host 才触发：next/link 自己只走 client navigation，
 * 不走外链；这里只要不是 modifier-click（cmd/shift/ctrl/aux button）就触发。
 */
export function NavProgressLink({ onClick, children, ...rest }: Props) {
  const progress = useRouteProgress();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // 跳过新窗口/中键/带修饰键的点击——它们不会走 client navigation
    const isModifier =
      e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
    if (!isModifier) progress.start();
    onClick?.(e);
  };

  return (
    <Link {...rest} onClick={handleClick}>
      {children}
    </Link>
  );
}
