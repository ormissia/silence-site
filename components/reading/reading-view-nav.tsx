"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ReadingViewNav() {
  const active = usePathname() === "/reading/evolution" ? "evolution" : "shelf";
  return (
    <nav aria-label="阅读视图" className="relative my-7 grid w-fit grid-cols-[repeat(2,4em)] gap-6 text-label tracking-normal">
      {[{ key: "shelf", href: "/reading", label: "年度书架" }, { key: "evolution", href: "/reading/evolution", label: "阅读演化" }].map((view) => (
        <Link key={view.key} href={view.href} scroll={false} aria-current={active === view.key ? "page" : undefined}
          className={`pb-2 transition-colors hover:text-ink ${active === view.key ? "text-ink" : "text-muted"}`}>
          {view.label}
        </Link>
      ))}
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-px w-[4em] bg-ink transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{ transform: active === "evolution" ? "translateX(calc(4em + 1.5rem))" : "translateX(0)" }} />
    </nav>
  );
}
