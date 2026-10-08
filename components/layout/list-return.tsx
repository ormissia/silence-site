"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NavProgressLink, useNavProgressClick, type NavProgressLinkProps } from "./nav-link";
import { useRouteProgress } from "./route-progress-state";

const POSITION_KEY = "silence:list-position";
const RETURN_KEY = "silence:return-to-list";
const positionKey = (href: string) => `${POSITION_KEY}:${href}`;

export function rememberListPosition(href: string) {
  try {
    sessionStorage.setItem(positionKey(href), String(window.scrollY));
  } catch {
    // Navigation remains usable when session storage is unavailable.
  }
}

/** 与进度共用导航意图；修饰键、下载或调用方取消时不写列表位置。 */
export function EnterListLink({ listHref, ...props }: Omit<NavProgressLinkProps, "onNavigate"> & { listHref: string }) {
  return <NavProgressLink {...props} onNavigate={() => rememberListPosition(listHref)} />;
}

/** 适配已有 Link 回调入口（如 SVG 书籍节点），不监听页面级点击。 */
export function useEnterListClick(listHref: string) {
  return useNavProgressClick({ onNavigate: () => rememberListPosition(listHref) });
}

export function RestoreListScroll() {
  return <Suspense fallback={null}><ListScrollRestoration /></Suspense>;
}

function ListScrollRestoration() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    try {
      const href = `${window.location.pathname}${window.location.search}`;
      const requested = sessionStorage.getItem(RETURN_KEY);
      if (requested === null) return;
      sessionStorage.removeItem(RETURN_KEY);
      if (requested !== href) return;
      const saved = sessionStorage.getItem(positionKey(href));
      if (saved?.trim() && Number.isFinite(Number(saved))) window.scrollTo(0, Number(saved));
    } catch {
      // A corrupt or unavailable storage entry should never block the list.
    }
  }, [pathname, search]);
  return null;
}

export function requestListReturn(href: string) {
  try { sessionStorage.setItem(RETURN_KEY, href); } catch { /* Navigation remains usable. */ }
}

/** 非链接关闭操作（Escape / 点击弹窗外部）与返回链接使用同一记录协议。 */
export function useReturnToList(href: string) {
  const router = useRouter();
  const progress = useRouteProgress();
  return () => {
    requestListReturn(href);
    progress.start();
    router.replace(href, { scroll: false });
  };
}

export function ReturnToListLink({ href, ...props }: Omit<NavProgressLinkProps, "href" | "onNavigate"> & {
  href: string;
}) {
  return <NavProgressLink {...props} href={href} onNavigate={() => requestListReturn(href)} />;
}
