// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollMarquee } from "@/components/layout/scroll-marquee";

let period = 600;
let viewportWidth = 1440;
let reduced = false;
let resize: () => void;
const motionListeners = new Set<() => void>();
const frames = new Map<number, FrameRequestCallback>();
let nextFrame = 1;

function flushFrames() {
  act(() => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach(callback => callback(0));
  });
}

function scrollTo(y: number) {
  vi.stubGlobal("scrollY", y);
  fireEvent.scroll(window);
}

beforeEach(() => {
  period = 600;
  viewportWidth = 1440;
  reduced = false;
  frames.clear();
  motionListeners.clear();
  vi.stubGlobal("scrollY", 0);
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    return new DOMRect(0, 0, this.tagName === "SPAN" ? period : viewportWidth, 20);
  });
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => viewportWidth);
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)));
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { resize = callback; }
    observe() {}
    disconnect() {}
  });
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return reduced; },
    addEventListener: (_type: string, callback: () => void) => motionListeners.add(callback),
    removeEventListener: (_type: string, callback: () => void) => motionListeners.delete(callback),
  }));
});
afterEach(cleanup);

describe("scroll-driven header strip", () => {
  it("follows scroll distance and direction, batching events without scheduling idle frames", () => {
    const { container } = render(<ScrollMarquee />);
    const track = container.querySelector<HTMLElement>(".silence-marquee")!;
    flushFrames();
    vi.mocked(requestAnimationFrame).mockClear();
    const layoutReads = vi.mocked(HTMLElement.prototype.getBoundingClientRect).mock.calls.length;

    scrollTo(100);
    scrollTo(200);
    scrollTo(400);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    flushFrames();
    expect(track.style.transform).toBe("translateX(-120px)");
    expect(frames.size).toBe(0);

    scrollTo(200);
    flushFrames();
    expect(track.style.transform).toBe("translateX(-60px)");
    expect(HTMLElement.prototype.getBoundingClientRect).toHaveBeenCalledTimes(layoutReads);
    expect(frames.size).toBe(0);
  });

  it("keeps enough copies to fill wide screens, wraps, and remeasures after resize", () => {
    const { container } = render(<ScrollMarquee />);
    const track = container.querySelector<HTMLElement>(".silence-marquee")!;
    expect(track.children.length).toBe(4);
    scrollTo(2100);
    flushFrames();
    expect(track.style.transform).toBe("translateX(-30px)");

    viewportWidth = 2400;
    period = 500;
    act(() => resize());
    flushFrames();
    expect(track.children.length).toBe(6);
    expect(track.style.transform).toBe("translateX(-130px)");
    scrollTo(0);
    flushFrames();
    expect(track.style.transform).toBe("translateX(0px)");
  });

  it("stops pending motion when reduced motion is enabled and resumes from actual scroll position", () => {
    const { container } = render(<ScrollMarquee />);
    const track = container.querySelector<HTMLElement>(".silence-marquee")!;
    scrollTo(500);
    reduced = true;
    act(() => motionListeners.forEach(listener => listener()));
    expect(frames.size).toBe(0);
    expect(track.style.transform).toBe("translateX(0px)");
    scrollTo(1000);
    expect(frames.size).toBe(0);

    reduced = false;
    act(() => motionListeners.forEach(listener => listener()));
    flushFrames();
    expect(track.style.transform).toBe("translateX(-300px)");
  });

  it("cancels pending work and removes listeners on unmount", () => {
    const { unmount } = render(<ScrollMarquee />);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(motionListeners.size).toBe(0);
    scrollTo(500);
    expect(frames.size).toBe(0);
  });
});
