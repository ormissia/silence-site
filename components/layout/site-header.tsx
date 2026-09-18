"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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

/**
 * 圆角下划线 hover 动画的导航项。
 * 使用 group + 子 span 实现宽度从中心展开，避免布局抖动。
 * Click 时通过 NavProgressLink 触发顶部进度条；active:scale-95 给即时按压反馈。
 */
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
  return (
    <NavProgressLink
      href={href}
      className="group relative inline-block py-1 active:scale-95 active:opacity-80 transition-transform"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-expanded={expanded}
    >
      <span className="inline-block text-ink transition-transform duration-200 ease-out group-hover:scale-110">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute -bottom-1 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-ink transition-[width] duration-300 ease-out group-hover:w-full"
      />
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
        className={`absolute left-1/2 top-full z-50 -translate-x-1/2 pt-4 transition-transform duration-200 ease-out motion-reduce:transition-none ${
          open
            ? "visible translate-y-0"
            : "pointer-events-none invisible -translate-y-1"
        }`}
      >
        <div className="w-60 overflow-hidden rounded-lg border border-white/25 bg-black/5 p-2 shadow-[0_12px_32px_rgba(0,0,0,0.16)] backdrop-blur-[10px]">
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
  return (
    <header className="fixed inset-x-0 top-0 z-50 isolate border-b border-ink/10">
      {/* 模糊放在独立背景层，避免父级 backdrop-filter 限制下拉面板的背景采样。 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 backdrop-blur-md" />
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 md:px-10">
        <NavProgressLink
          href="/"
          className="leading-none text-white transition-opacity duration-150 active:opacity-60"
        >
          <span className="block text-2xl uppercase tracking-tighter text-gradient-accent md:text-3xl">
            SILENCE
          </span>
          <span className="mt-1 block font-sans text-annotation tracking-wider">
            Was it a memory, or was it a dream? Even I don&apos;t know.
          </span>
        </NavProgressLink>

        <nav className="hidden items-center gap-8 font-sans text-label uppercase tracking-[0.24em] md:flex">
          <NavMenu href="/works" label="Works" items={WORKS_MENU} />
          <NavMenu href="/journal" label="Journal" items={JOURNAL_MENU} />
          <NavLink href="/reading">Reading</NavLink>
          <NavLink href="/about">About</NavLink>
        </nav>
      </div>
    </header>
  );
}
