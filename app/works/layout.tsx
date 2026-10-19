import type { ReactNode } from "react";
import { CoverTransitionBoundary } from "@/components/work/cover-transition-boundary";
import "@/components/work/cover-transition.css";

export default function WorksLayout({ children }: { children: ReactNode }) {
  return <CoverTransitionBoundary>{children}</CoverTransitionBoundary>;
}
