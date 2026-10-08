// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteHeader } from "@/components/layout/site-header";
import { RouteProgressProvider } from "@/components/layout/route-progress-state";

const state = vi.hoisted(() => ({ target: null as unknown, setPinnedTarget: vi.fn() }));
vi.mock("@/components/layout/detail-return", () => ({ useDetailReturn: () => ({ target: state.target, pinnedTarget: state.target, setPinnedTarget: state.setPinnedTarget }) }));
vi.mock("next/navigation", () => ({ usePathname: () => window.location.pathname, useSearchParams: () => new URLSearchParams(window.location.search) }));
vi.mock("next/link", () => ({ default: ({ href, ...props }: ComponentProps<"a">) => <a {...props} href={href} /> }));

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, "", "/works/example?tab=film");
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  const element = document.createElement("span");
  state.target = { element, pathname: "/works/example", href: "/works?tab=film", label: "Works", ariaLabel: "返回作品列表" };
});
afterEach(cleanup);

describe("header detail return protocol", () => {
  it("does not request restoration when the pinned return opens a new window", () => {
    render(<RouteProgressProvider><div onClick={(event) => event.preventDefault()}><SiteHeader /></div></RouteProgressProvider>);
    const link = screen.getByRole("link", { name: "返回作品列表" });
    link.setAttribute("target", "_blank");
    fireEvent.click(link);
    expect(sessionStorage.getItem("silence:return-to-list")).toBeNull();
  });

  it("records the pinned destination for ordinary return navigation", () => {
    render(<RouteProgressProvider><div onClick={(event) => event.preventDefault()}><SiteHeader /></div></RouteProgressProvider>);
    fireEvent.click(screen.getByRole("link", { name: "返回作品列表" }));
    expect(sessionStorage.getItem("silence:return-to-list")).toBe("/works?tab=film");
  });
});
