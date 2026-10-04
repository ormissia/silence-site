"use client";

import { Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NavProgressLink } from "./nav-link";
import { ThemeToggle } from "./theme-toggle";

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

const READING_MENU: Array<{ href: string; label: string }> = [
  { href: "/reading", label: "Shelf / 年度书架" },
  { href: "/reading/evolution", label: "Evolution / 阅读演化" },
];

/** 胶囊导航保留真实链接、当前页状态和路由进度反馈。 */
function NavLink({
  href,
  children,
  expanded,
}: {
  href: string;
  children: ReactNode;
  expanded?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <NavProgressLink
      href={href}
      aria-current={active ? "page" : undefined}
      className="silence-pill silence-pill-nav active:opacity-80"
      aria-expanded={expanded}
    >
      <span className="inline-block">{children}</span>
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
  alignEnd = false,
}: {
  href: string;
  label: string;
  items: Array<{ href: string; label: string }>;
  alignEnd?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
        className={`site-nav-dropdown absolute top-full z-50 pt-3 ${alignEnd ? "right-0 md:right-auto" : "left-0"} md:left-1/2 md:-translate-x-1/2`}
        data-open={open}
      >
        <div className="site-nav-dropdown-surface">
          <ul className="flex flex-col gap-1.5" aria-label={`${label} 分类`}>
            {items.map((item, index) => {
              const [itemPath, query] = item.href.split("?");
              const active = pathname === itemPath && Array.from(new URLSearchParams(query)).every(
                ([key, value]) => searchParams.get(key) === value
              );
              const [title, subtitle] = item.label.split(" / ");
              return (
                <li
                  key={item.href}
                  className="site-nav-dropdown-item"
                  style={{ "--menu-item-index": index } as CSSProperties}
                >
                  <NavProgressLink
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    tabIndex={open ? undefined : -1}
                    className="silence-pill silence-pill-nav site-nav-dropdown-link"
                    onClick={() => setOpen(false)}
                  >
                    <span className="uppercase">{title}</span>
                    <span className="shrink-0 normal-case tracking-normal opacity-60">{subtitle}</span>
                  </NavProgressLink>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const [overPhoto, setOverPhoto] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const midpoint = (headerRef.current?.getBoundingClientRect().height ?? 90) / 2;
      setOverPhoto(Array.from(document.querySelectorAll('[data-header-photo], main [data-theme-surface="dark"]')).some((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top <= midpoint && rect.bottom > midpoint;
      }));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    const themeObserver = new MutationObserver(schedule);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);
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
    <header ref={headerRef} data-over-photo={overPhoto} className="site-header fixed inset-x-0 top-0 z-50 isolate border-b border-ink/10">
      {/* 模糊放在独立背景层，避免父级 backdrop-filter 限制下拉面板的背景采样。 */}
      <div aria-hidden className="site-header-glass pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto flex max-w-[1400px] items-center justify-between flex-wrap gap-4 px-6 py-4 md:px-12">
        <NavProgressLink
          href="/"
          className="order-1 leading-none text-ink transition-opacity duration-150 active:opacity-60"
        >
          <span className="block text-xl font-semibold uppercase tracking-[0.28em] text-gradient-accent">
            SILENCE
          </span>

        </NavProgressLink>

        <nav className="order-3 flex w-full flex-wrap items-center gap-1.5 font-sans uppercase sm:gap-2 md:order-2 md:ml-auto md:w-auto">
          <Suspense fallback={<NavLink href="/works">Works</NavLink>}>
            <NavMenu href="/works" label="Works" items={WORKS_MENU} />
          </Suspense>
          <Suspense fallback={<NavLink href="/journal">Journal</NavLink>}>
            <NavMenu href="/journal" label="Journal" items={JOURNAL_MENU} />
          </Suspense>
          <Suspense fallback={<NavLink href="/reading">Reading</NavLink>}>
            <NavMenu href="/reading" label="Reading" items={READING_MENU} alignEnd />
          </Suspense>
          <NavLink href="/about">About</NavLink>
        </nav>
        <ThemeToggle />
      </div>
      <div className="site-header-marquee hidden overflow-hidden border-t border-ink/10 py-1.5 text-[9px] uppercase tracking-[0.22em] sm:block" aria-hidden="true">
        <div className="silence-marquee">{[0, 1].map(i => <span key={i} className="whitespace-nowrap pr-12">SILENCE — PHOTOGRAPHS & NOTES — LANDSCAPE — PORTRAIT — SNAPSHOTS — FILM — READING — JOURNAL — </span>)}</div>
      </div>
    </header>
  );
}
