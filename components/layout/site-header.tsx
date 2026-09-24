"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { NavProgressLink } from "./nav-link";

const WORKS_MENU: Array<{ href: string; label: string }> = [
  { href: "/works?tab=landscape", label: "Landscape / 风光" },
  { href: "/works?tab=portrait", label: "Portrait / 人像" },
  { href: "/works?tab=snapshots", label: "Snapshots / 日常" },
  { href: "/works?tab=film", label: "Film / 胶片" },
];

const JOURNAL_MENU: Array<{ href: string; label: string }> = [
  { href: "/journal?cat=tech", label: "Tech / 技术" },
  { href: "/journal?cat=life", label: "Life / 生活" },
];

/** 胶囊导航保留真实链接、当前页状态和路由进度反馈。 */
function NavLink({
  href,
  children,
  onMouseEnter,
  onMouseLeave,
  expanded,
}: {
  href: string;
  children: ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  expanded?: boolean;
}) {
  const pathname = usePathname();
  const [orbitHover, setOrbitHover] = useState(false);
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <NavProgressLink
      href={href}
      aria-current={active ? "page" : undefined}
      data-nav-pill=""
      data-orbit-hover={orbitHover ? "true" : undefined}
      className="silence-pill group relative text-muted active:opacity-80"
      onMouseEnter={() => { setOrbitHover(true); onMouseEnter?.(); }}
      onMouseLeave={() => { setOrbitHover(false); onMouseLeave?.(); }}
      aria-expanded={expanded}
    >
      <span className="inline-block">
        {children}
      </span>

    </NavProgressLink>
  );
}

/**
 * 带下拉菜单的导航条目。NavLink + 浮层共用一个 hover 容器，
 * 鼠标在条目与浮层之间穿行不会让浮层意外收回。
 */
function NavMenu({
  href,
  label,
  items,
}: {
  href: string;
  label: string;
  items: Array<{ href: string; label: string }>;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={scheduleClose}
      onFocus={handleEnter}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.currentTarget.querySelector("a")?.focus();
          setOpen(false);
        }
      }}
    >
      <NavLink href={href} expanded={open}>{label}</NavLink>
      <div
        className={`absolute left-0 top-full z-50 md:left-1/2 md:-translate-x-1/2 pt-4 transition-transform duration-200 ease-out motion-reduce:transition-none ${
          open
            ? "visible translate-y-0"
            : "pointer-events-none invisible -translate-y-1"
        }`}
      >
        <div className="w-60 overflow-hidden rounded-lg border border-white/20 bg-paper/[0.55] p-2 shadow-[0_12px_32px_rgba(0,0,0,0.16)] backdrop-blur-[18px]">
          <ul className="flex flex-col gap-1" aria-label={`${label} 分类`}>
            {items.map((item) => (
              <li key={item.href}>
                <NavProgressLink
                  href={item.href}
                  className="group/item flex min-h-11 items-center justify-between gap-5 rounded-md px-3 py-2.5 font-sans text-caption tracking-[0.1em] text-ink [text-shadow:0_1px_3px_rgba(0,0,0,0.35)] transition-colors duration-200 hover:bg-white/15 hover:text-white focus-visible:bg-white/15 focus-visible:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink/60"
                  onClick={() => setOpen(false)}
                >
                  <span className="uppercase">{item.label.split(" / ")[0]}</span>
                  <span className="shrink-0 text-label normal-case tracking-normal">{item.label.split(" / ")[1]}</span>
                </NavProgressLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const updateHeight = () => document.documentElement.style.setProperty("--site-header-height", `${header.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    updateHeight();
    return () => observer.disconnect();
  }, []);
  return (
    <header ref={headerRef} className="site-header fixed inset-x-0 top-0 z-50 isolate border-b border-white/10">
      {/* 模糊放在独立背景层，避免父级 backdrop-filter 限制下拉面板的背景采样。 */}
      <div aria-hidden className="site-header-glass pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto flex max-w-[1400px] items-center justify-between flex-wrap gap-4 px-6 py-4 md:px-12">
        <NavProgressLink
          href="/"
          className="leading-none text-white transition-opacity duration-150 active:opacity-60"
        >
          <span className="block text-xl font-semibold uppercase tracking-[0.28em] text-gradient-accent">
            SILENCE
          </span>

        </NavProgressLink>

        <nav className="flex flex-wrap items-center gap-1.5 font-sans uppercase sm:gap-2">
          <NavMenu href="/works" label="Works" items={WORKS_MENU} />
          <NavMenu href="/journal" label="Journal" items={JOURNAL_MENU} />
          <NavLink href="/reading">Reading</NavLink>
          <NavLink href="/about">About</NavLink>
        </nav>
      </div>
      <div className="site-header-marquee hidden overflow-hidden border-t border-white/[0.06] py-1.5 text-[9px] uppercase tracking-[0.22em] sm:block" aria-hidden="true">
        <div className="silence-marquee">{[0, 1].map(i => <span key={i} className="whitespace-nowrap pr-12">SILENCE — PHOTOGRAPHS & NOTES — LANDSCAPE — PORTRAIT — SNAPSHOTS — FILM — READING — JOURNAL — </span>)}</div>
      </div>
    </header>
  );
}
