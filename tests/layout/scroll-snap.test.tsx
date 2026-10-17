// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScrollSnap, type ScrollSnapPoint } from "@/components/layout/use-scroll-snap";

let y = 0;
let eligible = true;
let onMediaChange: () => void;
const wheel = () => fireEvent.wheel(document.body, { deltaY: 120 });
const move = (top: number) => {
  y = top;
  fireEvent.scroll(window);
};

const POINTS: readonly ScrollSnapPoint[] = [
  0,
  { selector: "[data-snap-point='scene-end']", align: "end" },
  { selector: "[data-snap-point='guide']", gap: 32 },
  { selector: ".site-footer", align: "end" },
];

function ScrollSnap() {
  useScrollSnap({ points: POINTS });
  return null;
}

function mount() {
  const view = render(<>
    <ScrollSnap />
    <span data-snap-point="scene-end" />
    <h2 data-snap-point="guide">Guide</h2>
    <footer className="site-footer" />
  </>);
  const rect = (top: number, bottom = top) => () => ({ top: top - y, bottom: bottom - y } as DOMRect);
  vi.spyOn(view.container.querySelector("span")!, "getBoundingClientRect").mockImplementation(rect(1719, 1720));
  vi.spyOn(view.getByRole("heading"), "getBoundingClientRect").mockImplementation(rect(1728));
  vi.spyOn(view.getByRole("contentinfo"), "getBoundingClientRect").mockImplementation(rect(2700, 3000));
  return view;
}

beforeEach(() => {
  vi.useFakeTimers();
  y = 0;
  eligible = true;
  vi.stubGlobal("scrollY", 0);
  vi.spyOn(window, "scrollY", "get").mockImplementation(() => y);
  vi.stubGlobal("innerHeight", 720);
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(3000);
  document.documentElement.style.setProperty("--site-header-height", "96px");
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return eligible; },
    addEventListener: (_type: string, callback: () => void) => { onMediaChange = callback; },
    removeEventListener: vi.fn(),
  }));
  vi.spyOn(window, "scrollTo").mockImplementation((options) => {
    move((options as ScrollToOptions).top!);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.documentElement.style.removeProperty("--site-header-height");
  document.body.style.overflowY = "";
});

describe("shared scroll alignment", () => {
  it("waits for inertia to stop, then aligns the lower boundary only once", () => {
    y = 900;
    mount();
    wheel();
    move(940);
    vi.advanceTimersByTime(120);
    move(960);
    vi.advanceTimersByTime(159);
    expect(window.scrollTo).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(y).toBe(1000);
    const calls = vi.mocked(window.scrollTo).mock.calls.length;
    vi.advanceTimersByTime(1000);
    expect(window.scrollTo).toHaveBeenCalledTimes(calls);
  });

  it.each([
    [1000, 1010], [1000, 990], [970, 1020], [1030, 980], [800, 900],
  ])("does not pull back after moving from %i to %i or reach past the capture distance", (from, to) => {
    y = from;
    mount();
    wheel();
    move(to);
    vi.advanceTimersByTime(800);
    expect(y).toBe(to);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it.each([
    [800, 912, 1000], [1080, 1040, 1000], [100, 40, 0], [1510, 1560, 1600], [2180, 2240, 2280],
  ])("uses actual page movement to align from %i through %i to %i", (from, to, target) => {
    y = from;
    mount();
    wheel();
    move(to);
    vi.advanceTimersByTime(600);
    expect(y).toBe(target);
  });

  it("leaves restoration, nested scrolling, and expired input alone", () => {
    y = 960;
    mount();
    move(950);
    vi.advanceTimersByTime(500);
    wheel();
    vi.advanceTimersByTime(500);
    move(970);
    vi.advanceTimersByTime(500);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("cancels an in-progress alignment on new wheel input", () => {
    y = 900;
    mount();
    wheel();
    move(960);
    vi.advanceTimersByTime(240);
    expect(y).toBeGreaterThan(960);
    expect(y).toBeLessThan(1000);
    wheel();
    move(1050);
    vi.advanceTimersByTime(600);
    expect(y).toBe(1050);
  });

  it("cancels pending alignment for focus, pointer, history, viewport and motion changes", () => {
    mount();
    for (const cancel of [
      () => fireEvent.focusIn(document.body),
      () => fireEvent.pointerDown(document.body),
      () => fireEvent.click(document.body),
      () => fireEvent.keyDown(document.body, { key: "Tab" }),
      () => fireEvent.popState(window),
      () => fireEvent.resize(window),
      () => fireEvent.blur(window),
      () => onMediaChange(),
    ]) {
      move(900);
      wheel();
      move(960);
      cancel();
      vi.advanceTimersByTime(600);
      expect(y).toBe(960);
    }
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("uses page keys without capturing control keys or modified wheel gestures", () => {
    y = 1100;
    mount();
    fireEvent.keyDown(document.body, { key: " ", shiftKey: true });
    move(1040);
    vi.advanceTimersByTime(600);
    expect(y).toBe(1000);
    vi.mocked(window.scrollTo).mockClear();
    for (const input of [
      () => fireEvent.keyDown(document.body, { key: "ArrowDown", metaKey: true }),
      () => fireEvent.keyDown(document.body, { key: "Home" }),
      () => fireEvent.wheel(document.body, { deltaX: 120, deltaY: 10 }),
      () => fireEvent.wheel(document.body, { deltaY: 120, ctrlKey: true }),
    ]) {
      move(900);
      input();
      move(960);
      vi.advanceTimersByTime(600);
    }
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("stays off for reduced motion, small screens, locked scrolling and unmounted pages", () => {
    const view = mount();
    for (const block of [
      () => { eligible = false; },
      () => { eligible = true; document.body.style.overflowY = "hidden"; },
      () => { document.body.style.overflowY = ""; view.unmount(); },
    ]) {
      move(900);
      block();
      wheel();
      move(960);
      vi.advanceTimersByTime(600);
    }
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
