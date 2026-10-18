// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PageScrollSnap } from "@/components/layout/page-scroll-snap";
import { RestoreListScroll } from "@/components/layout/list-return";

let pathname = "/";
let search = "";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(search),
}));

let y = 0;
const move = (top: number) => {
  y = top;
  fireEvent.scroll(window);
};
const wheel = () => fireEvent.wheel(document.body, { deltaY: 40 });
const settle = () => vi.advanceTimersByTime(600);
const rect = (top: number, bottom = top + 1) => () => ({ top: top - y, bottom: bottom - y } as DOMRect);

function HomeFixture({ blocked = false, restore = false }: { blocked?: boolean; restore?: boolean }) {
  return <>
    <PageScrollSnap />
    {blocked && <div className="home-splash" />}
    {restore && <RestoreListScroll />}
    {[0, 0.75, 1.15, 1.85, 2.55].map((vh) => (
      <span key={vh} className="home-hero-snap-point" ref={(element) => {
        if (element) element.getBoundingClientRect = rect(vh * 720 + 96);
      }} />
    ))}
    <h2 data-home-snap-point="works" ref={(element) => {
      if (element) element.getBoundingClientRect = rect(2928);
    }}>Works</h2>
    <section data-home-snap-point="reading" ref={(element) => {
      if (element) element.getBoundingClientRect = rect(3696, 4320);
    }} />
    <span data-home-snap-point="reading-end" ref={(element) => {
      if (element) element.getBoundingClientRect = rect(4800);
    }} />
    <footer className="site-footer" ref={(element) => {
      if (element) element.getBoundingClientRect = rect(5520, 6000);
    }}><span data-footer-snap-point ref={(element) => {
      if (element) element.getBoundingClientRect = rect(5520, 5680);
    }} /></footer>
  </>;
}

beforeEach(() => {
  vi.useFakeTimers();
  y = 0;
  pathname = "/";
  search = "";
  sessionStorage.clear();
  window.history.replaceState(null, "", "/");
  vi.stubGlobal("scrollY", 0);
  vi.spyOn(window, "scrollY", "get").mockImplementation(() => y);
  vi.stubGlobal("innerHeight", 720);
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(6000);
  document.documentElement.style.setProperty("--site-header-height", "96px");
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.spyOn(window, "scrollTo").mockImplementation((options: ScrollToOptions | number, top?: number) => {
    move(typeof options === "number" ? top! : options?.top ?? y);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  sessionStorage.clear();
  document.documentElement.style.removeProperty("--site-header-height");
});

describe("page snap configurations", () => {
  it.each([0, 540, 828, 1332, 1836, 2800, 3600, 4704, 4960])("keeps the homepage landing position at %i", (target) => {
    const from = target === 0 ? 100 : target - 100;
    const to = target === 0 ? 40 : target - 40;
    y = from;
    render(<HomeFixture />);
    wheel();
    move(to);
    settle();
    expect(y).toBeCloseTo(target);
    if (target < 4960) {
      wheel();
      move(target + 12);
      settle();
      expect(y).toBeCloseTo(target + 12);
    }
  });

  it("leaves the restored position alone and only aligns after a new page scroll", () => {
    sessionStorage.setItem("silence:return-to-list", "/");
    sessionStorage.setItem("silence:list-position:/", "3540");
    render(<HomeFixture restore />);
    settle();
    expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith(0, 3540);
    expect(y).toBe(3540);
    wheel();
    move(3560);
    settle();
    expect(y).toBe(3600);
  });

  it("does not align through the splash, including when it appears during pending input", () => {
    y = 440;
    const view = render(<HomeFixture blocked />);
    wheel();
    move(500);
    settle();
    expect(window.scrollTo).not.toHaveBeenCalled();
    view.rerender(<HomeFixture />);
    move(440);
    wheel();
    move(500);
    view.rerender(<HomeFixture blocked />);
    settle();
    expect(window.scrollTo).not.toHaveBeenCalled();
    view.rerender(<HomeFixture />);
    move(440);
    wheel();
    move(500);
    settle();
    expect(y).toBe(540);
  });

  it("uses the same feel on About after a client-side page switch, with no old targets", () => {
    y = 440;
    const view = render(<HomeFixture />);
    wheel();
    move(500);
    pathname = "/about";
    view.rerender(<>
      <PageScrollSnap />
      <span data-about-snap-point="scene-end" ref={(element) => {
        if (element) element.getBoundingClientRect = rect(1719, 1720);
      }} />
      <h2 data-about-snap-point="guide" ref={(element) => {
        if (element) element.getBoundingClientRect = rect(1728);
      }}>Guide</h2>
    </>);
    settle();
    expect(y).toBe(500);
    move(900);
    wheel();
    move(960);
    settle();
    expect(y).toBe(1000);
    move(1500);
    wheel();
    move(1560);
    settle();
    expect(y).toBe(1600);
  });

  it.each(["/about", "/works", "/works/example", "/journal", "/journal/example", "/reading", "/reading/evolution", "/reading/example"])("uses the compact footer landing on %s", (route) => {
    pathname = route;
    y = 4840;
    render(<HomeFixture />);
    wheel();
    move(4880);
    settle();
    expect(y).toBe(4960);
    wheel();
    move(4976);
    settle();
    expect(y).toBe(4976);
    move(5080);
    wheel();
    move(5040);
    settle();
    expect(y).toBe(4960);
  });

  it("cancels pending and active alignment between routes with the same footer-only config", () => {
    pathname = "/works";
    y = 4840;
    const view = render(<HomeFixture />);
    wheel();
    move(4880);
    pathname = "/journal";
    view.rerender(<HomeFixture />);
    settle();
    expect(y).toBe(4880);
    move(4840);
    wheel();
    move(4880);
    vi.advanceTimersByTime(240);
    expect(y).toBeGreaterThan(4880);
    const interruptedAt = y;
    search = "tab=tech";
    view.rerender(<HomeFixture />);
    settle();
    expect(y).toBe(interruptedAt);
  });

  it("keeps only the footer stop when a tall viewport puts the guide within 32px of it", () => {
    pathname = "/about";
    y = 1480;
    render(<>
      <PageScrollSnap />
      <h2 data-about-snap-point="guide" ref={(element) => {
        if (element) element.getBoundingClientRect = rect(1744);
      }}>Guide</h2>
      <span data-footer-snap-point ref={(element) => {
        if (element) element.getBoundingClientRect = rect(2155, 2320);
      }} />
    </>);
    wheel();
    move(1520);
    settle();
    expect(y).toBe(1600);
    wheel();
    move(1608);
    settle();
    expect(y).toBe(1608);
    move(1700);
    wheel();
    move(1680);
    settle();
    expect(y).toBe(1600);
  });

});
