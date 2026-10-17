import type { ReactNode } from "react";

export function ReadingBackground({ children }: { children: ReactNode }) {
  return (
    <section
      aria-labelledby="reading-heading"
      className="relative z-20 -mt-px overflow-clip bg-paper"
    >
      {children}
    </section>
  );
}
