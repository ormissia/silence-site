"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Animate the arriving content once, while the shared heading and tabs stay mounted. */
export function ReadingViewContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div key={pathname} className="reading-view-content">{children}</div>;
}
