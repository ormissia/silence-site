// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { motionValue } from "framer-motion";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AboutIceReveal } from "@/components/about/about-ice-reveal";
import { createIceRenderer, ICE_LIFETIME_MS } from "@/components/about/ice-reveal-renderer";

vi.mock("@/components/about/ice-reveal-renderer", () => ({
  ICE_LIFETIME_MS: 3000,
  createIceRenderer: vi.fn(),
}));

const renderer = { resize: vi.fn(), draw: vi.fn(), clear: vi.fn(), dispose: vi.fn() };
const fadeOpacity = motionValue(0.4);
const shadeOpacity = motionValue(0);
let reduced = false;
let hidden = false;
let imageTop = -120;
let intersect: (entries: { isIntersecting: boolean }[]) => void;
const mediaListeners = new Set<() => void>();
const images: FakeImage[] = [];
class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 0;
  naturalHeight = 0;
  src = "";
  constructor() { images.push(this); }
}
function Fixture() {
  const ref = useRef<HTMLDivElement>(null);
  return <div ref={ref} data-testid="surface"><AboutIceReveal interactionRef={ref} fadeOpacity={fadeOpacity} shadeOpacity={shadeOpacity} /><a href="/works">Works</a></div>;
}
function loadImages() {
  act(() => images.forEach(image => {
    image.naturalWidth = image.naturalHeight = 1254;
    image.onload?.();
  }));
}
function pointer(element: Element, x: number, y: number, type = "pointermove") {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
  Object.defineProperties(event, { isPrimary: { value: true }, pointerId: { value: 1 } });
  fireEvent(element, event);
  return event;
}
const advance = (ms = 20) => act(() => vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks();
  reduced = false; hidden = false; imageTop = -120; images.length = 0; mediaListeners.clear();
  fadeOpacity.set(0.4); shadeOpacity.set(0);
  vi.mocked(createIceRenderer).mockReturnValue(renderer);
  vi.stubGlobal("Image", FakeImage);
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return reduced; },
    addEventListener: (_: string, callback: () => void) => mediaListeners.add(callback),
    removeEventListener: (_: string, callback: () => void) => mediaListeners.delete(callback),
  }));
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: typeof intersect) { intersect = callback; }
    observe() {} disconnect() {}
  });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1000);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(900);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => new DOMRect(0, imageTop, 1000, 900));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("About ice reveal lifecycle", () => {
  it("starts transparent, paints in the moving image's coordinates, and returns fully to the original", () => {
    const view = render(<Fixture />); loadImages();
    const canvas = view.container.querySelector("canvas")!;
    expect(canvas.style.opacity).toBe("0");
    const surface = view.getByTestId("surface");
    pointer(surface, 300, 400); advance();
    expect(renderer.draw.mock.calls[0][0]).toEqual([[300, 380, 300, 380]]);
    expect(canvas.style.opacity).toBe("1");
    pointer(surface, 350, 420); advance();
    expect(renderer.draw.mock.calls.at(-1)![0]).toEqual([[300, 380, 350, 360]]);
    fireEvent.pointerLeave(surface);
    advance(ICE_LIFETIME_MS + 200);
    expect(canvas.style.opacity).toBe("0");
    const draws = renderer.draw.mock.calls.length;
    advance(1000);
    expect(renderer.draw).toHaveBeenCalledTimes(draws);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not bridge after scrolling and does not intercept controls or touch scrolling", () => {
    const view = render(<Fixture />); loadImages();
    const surface = view.getByTestId("surface");
    pointer(surface, 200, 300); advance();
    imageTop = -200; fireEvent.scroll(window);
    act(() => { fadeOpacity.set(0.65); shadeOpacity.set(0.22); });
    const event = pointer(surface, 220, 300, "pointerdown"); advance();
    expect(event.defaultPrevented).toBe(false);
    expect(renderer.draw.mock.calls.at(-1)![0]).toEqual([[220, 400, 220, 400]]);
    expect(renderer.draw.mock.calls.at(-1)!.slice(3)).toEqual([0.65, 0.22]);
    expect(createIceRenderer).toHaveBeenCalledTimes(1);
    pointer(view.getByText("Works"), 100, 100); advance();
    expect(renderer.draw.mock.calls.at(-1)![0]).toEqual([]);
    pointer(surface, 600, 300); advance();
    expect(renderer.draw.mock.calls.map(([strokes]) => strokes)).toContainEqual([[600, 400, 600, 400]]);
  });

  it("releases WebGL when reduced motion is enabled and initializes only after it is disabled", () => {
    reduced = true;
    const view = render(<Fixture />); loadImages();
    pointer(view.getByTestId("surface"), 200, 300); advance();
    expect(createIceRenderer).not.toHaveBeenCalled();
    act(() => { reduced = false; mediaListeners.forEach(listener => listener()); });
    expect(createIceRenderer).toHaveBeenCalledTimes(1);
    pointer(view.getByTestId("surface"), 200, 300); advance();
    act(() => { reduced = true; mediaListeners.forEach(listener => listener()); });
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(view.container.querySelector("canvas")!.style.opacity).toBe("0");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops rendering offscreen and in a background tab, then starts a fresh trail", () => {
    const view = render(<Fixture />); loadImages();
    const surface = view.getByTestId("surface");
    pointer(surface, 200, 300); advance();
    act(() => intersect([{ isIntersecting: false }]));
    const draws = renderer.draw.mock.calls.length;
    pointer(surface, 300, 300); advance(1000);
    expect(renderer.draw).toHaveBeenCalledTimes(draws);
    act(() => intersect([{ isIntersecting: true }]));
    pointer(surface, 500, 300); advance();
    expect(renderer.draw.mock.calls.map(([strokes]) => strokes)).toContainEqual([[500, 480, 500, 480]]);
    hidden = true; fireEvent(document, new Event("visibilitychange"));
    expect(view.container.querySelector("canvas")!.style.opacity).toBe("0");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("falls back on context loss and rebuilds after restoration without a stale stroke", () => {
    const view = render(<Fixture />); loadImages();
    const canvas = view.container.querySelector("canvas")!;
    pointer(view.getByTestId("surface"), 200, 300); advance();
    const lost = new Event("webglcontextlost", { cancelable: true });
    fireEvent(canvas, lost);
    expect(lost.defaultPrevented).toBe(true);
    expect(canvas.style.opacity).toBe("0");
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    fireEvent(canvas, new Event("webglcontextrestored"));
    expect(createIceRenderer).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps the original after an image failure and cleans up pending work on unmount", () => {
    const view = render(<Fixture />);
    act(() => images[1].onerror?.()); loadImages();
    expect(createIceRenderer).not.toHaveBeenCalled();
    view.unmount();
    expect(mediaListeners.size).toBe(0);
    expect(images.every(image => !image.onload && !image.onerror)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
