"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function ReadingBackground({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [loadBackground, setLoadBackground] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setLoadBackground(true);
      observer.disconnect();
    }, { rootMargin: "600px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      aria-labelledby="reading-heading"
      className="relative z-20 -mt-px overflow-hidden bg-paper"
      style={{
        backgroundImage: loadBackground ? "url('/images/cover.jpg')" : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {children}
    </section>
  );
}
