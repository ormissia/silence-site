"use client";

import { useEffect, useState } from "react";
import { getAccentStyle } from "@/lib/accent";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try { localStorage.setItem("silence-theme", next); } catch { /* Private browsing may reject storage. */ }
  };

  return (
    <button type="button" onClick={toggle} aria-pressed={theme === "light"}
      style={getAccentStyle("theme-toggle")}
      aria-label={theme === "light" ? "切换到夜间模式" : "切换到白天模式"}
      title={theme === "light" ? "夜间模式" : "白天模式"}
      className="silence-pill silence-pill-nav theme-toggle order-2 ml-auto h-9 w-9 !p-0 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:order-3 md:ml-1">
      {theme === "light" ? (
        <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.9 13.1A9 9 0 0 1 10.9 3.1 9 9 0 1 0 20.9 13.1Z" /></svg>
      ) : (
        <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
      )}
    </button>
  );
}
