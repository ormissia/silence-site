"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { beginCoverTransition, cancelCoverTransition, checkCoverTransitionRoute } from "./cover-transition";

export function CoverTransitionBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  useEffect(() => { checkCoverTransitionRoute(pathname); }, [pathname]);
  useEffect(() => {
    const onReturn = (event: Event) => {
      const href = (event as CustomEvent<{ href: string }>).detail?.href;
      const header = document.querySelector<HTMLElement>("header[data-work-slug]");
      if (header && href && new URL(href, window.location.href).pathname === "/works") {
        beginCoverTransition(header, header.dataset.workSlug!, "return");
      }
    };
    window.addEventListener("silence:list-return", onReturn);
    return () => { window.removeEventListener("silence:list-return", onReturn); cancelCoverTransition(); };
  }, []);
  return children;
}
