"use client";

import Link from "next/link";
import { useEffect, type MouseEvent, type ReactNode } from "react";

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

export function RestoreListScroll() {
  useEffect(() => {
    try {
      const href = `${window.location.pathname}${window.location.search}`;
      if (sessionStorage.getItem(RETURN_KEY) !== href) return;
      sessionStorage.removeItem(RETURN_KEY);
      const saved = sessionStorage.getItem(positionKey(href));
      if (saved !== null && Number.isFinite(Number(saved))) window.scrollTo(0, Number(saved));
    } catch {
      // A corrupt or unavailable storage entry should never block the list.
    }
  }, []);
  return null;
}

export function ReturnToListLink({ href, className, children }: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    try { sessionStorage.setItem(RETURN_KEY, href); } catch { /* The link still works. */ }
  };
  return <Link href={href} className={className} onClick={onClick}>{children}</Link>;
}
