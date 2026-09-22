import type { ReactNode } from "react";

export function ReadingBackground({ children }: { children: ReactNode }) {
  return (
    <section
      aria-labelledby="reading-heading"
      className="relative z-20 -mt-px overflow-hidden bg-paper"
    >
      {children}
    </section>
  );
}
