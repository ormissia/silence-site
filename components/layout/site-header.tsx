"use client";

import { useRef, useState, type ReactNode } from "react";
import { NavProgressLink } from "./nav-link";

const WORKS_MENU: Array<{ href: string; label: string }> = [
  { href: "/works?tab=landscape", label: "Landscape / 风光" },
  { href: "/works?tab=portrait", label: "Portrait / 人像" },
  { href: "/works?tab=casual", label: "Snapshots / 日常" },
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
}: {
  href: string;
  children: ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <NavProgressLink
      href={href}
      className="group relative inline-block py-1 active:scale-95 active:opacity-80 transition-transform"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={scheduleClose}>
      <NavLink href={href}>{label}</NavLink>
      <div
        className={`absolute left-1/2 top-full z-50 mt-4 -translate-x-1/2 transition duration-200 ease-out ${
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <div className="w-[210px] overflow-hidden rounded-xl border border-ink/10 bg-white/10 py-2 backdrop-blur-md">
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.href}>
                <NavProgressLink
                  href={item.href}
                  className="group/item flex origin-left items-center gap-2 px-4 py-1.5 font-sans text-[11px] uppercase tracking-[0.2em] text-white transition-transform duration-200 ease-out hover:scale-125 active:scale-100 active:opacity-70"
                  onClick={() => setOpen(false)}
                >
                  <span
                    aria-hidden
                    className="block h-px w-2 origin-left scale-x-0 bg-white transition-transform duration-200 ease-out group-hover/item:scale-x-100"
                  />
                  <span>{item.label}</span>
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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/10 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 md:px-10">
        <NavProgressLink
          href="/"
          className="leading-none text-white transition-opacity duration-150 active:opacity-60"
        >
          <span className="block font-sans text-2xl uppercase tracking-tighter md:text-3xl">
            SILENCE
          </span>
          <span className="mt-1 block font-sans text-[10px] tracking-wider">
            Was it a memory, or was it a dream? Even I don&apos;t know.
          </span>
        </NavProgressLink>

        <nav className="hidden items-center gap-8 font-sans text-xs uppercase tracking-[0.24em] md:flex">
          <NavMenu href="/works" label="Works" items={WORKS_MENU} />
          <NavMenu href="/journal" label="Journal" items={JOURNAL_MENU} />
          <NavLink href="/reading">Reading</NavLink>
          <NavLink href="/about">About</NavLink>
        </nav>
      </div>
    </header>
  );
}
