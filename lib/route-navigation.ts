type RouteNavigationIntent = {
  href: string;
  currentHref: string;
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  target: string;
  download: boolean;
};

/** 仅判断进度反馈；实际导航继续由 Next Link 执行。 */
export function shouldStartRouteProgress(intent: RouteNavigationIntent): boolean {
  if (intent.defaultPrevented || intent.button !== 0 || intent.metaKey || intent.ctrlKey || intent.shiftKey || intent.altKey) return false;
  if (intent.download || intent.target && intent.target !== "_self") return false;
  try {
    const current = new URL(intent.currentHref);
    const next = new URL(intent.href, current);
    if (!/^https?:$/.test(next.protocol) || next.origin !== current.origin) return false;
    // 与 RouteProgress 观察的 pathname/search key 对齐；同页锚点无需路由加载反馈。
    return next.pathname !== current.pathname || next.searchParams.toString() !== current.searchParams.toString();
  } catch {
    return false;
  }
}
