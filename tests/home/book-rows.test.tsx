// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookRows } from "@/components/home/book-rows";

vi.mock("next/link", () => ({
  default: ({ prefetch: _prefetch, scroll: _scroll, ...props }: ComponentProps<"a"> & {
    prefetch?: boolean; scroll?: boolean;
  }) => <a {...props} />,
}));
vi.mock("@/components/media/reveal-image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  RevealImage: ({ revealIndex: _index, ...props }: ComponentProps<"img"> & { revealIndex?: number }) => <img {...props} />,
}));
vi.mock("@/lib/oss", () => ({ buildSrc: (src: string) => src }));

const books = Array.from({ length: 12 }, (_, index) => ({
  slug: `book-${index}`, title: `书 ${index}`, author: "作者", cover: `/cover-${index}.jpg`,
}));
let intersection: (entries: { isIntersecting: boolean }[]) => void;
let width = 700;
let distance = 600;
let hidden = false;
let reduced = false;
const resizes: (() => void)[] = [];
const motionListeners = new Set<() => void>();
let animations: WeakMap<HTMLElement, { currentTime: number; effect: { getComputedTiming: () => { progress: number } } }>;
const originalAnimations = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "getAnimations");
const originalScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");

function visible(value: boolean) {
  act(() => intersection([{ isIntersecting: value }]));
}
function advance(ms: number) { act(() => vi.advanceTimersByTime(ms)); }
function move(target: Element, x: number, y = 50) {
  fireEvent.pointerMove(target, { pointerType: "mouse", clientX: x, clientY: y });
}
function mount() {
  const result = render(<BookRows books={books} />);
  const gallery = result.getByRole("group", { name: "精选书籍" });
  const links = result.getAllByRole("link");
  visible(true);
  return { ...result, gallery, links };
}

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  window.history.replaceState(null, "", "/");
  width = 700;
  distance = 600;
  hidden = reduced = false;
  resizes.length = 0;
  motionListeners.clear();
  animations = new WeakMap();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => new DOMRect(0, 0, distance, 156));
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => width);
  vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockReturnValue(480);
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(104);
  Object.defineProperty(HTMLElement.prototype, "getAnimations", { configurable: true, value: function (this: HTMLElement) {
    if (!animations.has(this)) animations.set(this, { currentTime: 0, effect: { getComputedTiming: () => ({ progress: .37 }) } });
    return [animations.get(this)!];
  } });
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    pointerType: string;
    constructor(type: string, options: PointerEventInit) { super(type, options); this.pointerType = options.pointerType ?? "mouse"; }
  });
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: typeof intersection) { intersection = callback; }
    observe() {}
    disconnect() {}
  });
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { resizes.push(callback); }
    observe() {}
    disconnect() {}
  });
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return reduced; },
    addEventListener: (_type: string, callback: () => void) => motionListeners.add(callback),
    removeEventListener: (_type: string, callback: () => void) => motionListeners.delete(callback),
  }));
});
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.clearAllTimers();
  vi.useRealTimers();
  if (originalAnimations) Object.defineProperty(HTMLElement.prototype, "getAnimations", originalAnimations);
  else delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations;
  if (originalScrollIntoView) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScrollIntoView);
  else delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
});

describe("homepage book rows", () => {
  it("pauses every row on hover, resets the idle timer on movement, and ignores stationary pointer events after resuming", () => {
    const { gallery, links } = mount();
    expect(gallery.dataset.running).toBe("true");
    move(links[0], 100);
    expect(gallery.dataset.running).toBe("false");
    expect(links[0].dataset.selected).toBe("true");
    advance(2900);
    move(links[0], 101);
    advance(2999);
    expect(gallery.dataset.running).toBe("false");
    advance(1);
    expect(gallery.dataset.running).toBe("true");
    expect(links[0].dataset.selected).toBe("false");

    move(links[1], 101);
    expect(gallery.dataset.running).toBe("true");
    move(links[1], 102);
    expect(links[1].dataset.selected).toBe("true");
    expect(gallery.dataset.running).toBe("false");
  });

  it("restores immediately on leaving, and does not select books for touch movement", () => {
    const { gallery, links } = mount();
    move(links[0], 100);
    fireEvent.pointerLeave(gallery, { pointerType: "mouse" });
    expect(gallery.dataset.running).toBe("true");
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.pointerMove(links[0], { pointerType: "touch", clientX: 200 });
    expect(gallery.dataset.active).toBe("false");
  });

  it("keeps keyboard focus visible and paused beyond the pointer timeout and after a resize", () => {
    const { gallery, links } = mount();
    act(() => links[3].focus());
    expect(gallery.dataset.running).toBe("false");
    advance(4000);
    expect(links[3].dataset.selected).toBe("true");
    const track = links[3].closest<HTMLElement>("[data-book-track]")!;
    const animation = animations.get(track)!;
    const firstTime = animation.currentTime;
    width = 300;
    act(() => resizes.forEach(resize => resize()));
    expect(animation.currentTime).not.toBe(firstTime);
    expect(gallery.scrollLeft).toBe(0);
    expect(links[3].dataset.selected).toBe("true");
    expect(gallery.dataset.running).toBe("false");
    act(() => links[3].blur());
    expect(gallery.dataset.running).toBe("true");
  });

  it("does not turn mouse click focus into a persistent keyboard pause", () => {
    const { gallery, links } = mount();
    move(links[0], 100);
    fireEvent.pointerDown(links[0], { pointerType: "mouse" });
    act(() => links[0].focus());
    advance(3000);
    expect(gallery.dataset.running).toBe("true");
    fireEvent.keyDown(window, { key: "Tab" });
    act(() => links[1].focus());
    advance(4000);
    expect(gallery.dataset.running).toBe("false");
  });

  it("pauses offscreen, in the background, and under reduced motion, discarding stale hover timers", () => {
    const { gallery, links } = mount();
    move(links[0], 100);
    visible(false);
    expect(gallery.dataset.running).toBe("false");
    expect(gallery.dataset.active).toBe("false");
    expect(vi.getTimerCount()).toBe(0);
    visible(true);
    expect(gallery.dataset.running).toBe("true");
    hidden = true;
    fireEvent(document, new Event("visibilitychange"));
    expect(gallery.dataset.running).toBe("false");
    hidden = false;
    fireEvent(document, new Event("visibilitychange"));
    expect(gallery.dataset.running).toBe("true");
    reduced = true;
    act(() => motionListeners.forEach(listener => listener()));
    expect(gallery.dataset.running).toBe("false");
    reduced = false;
    act(() => motionListeners.forEach(listener => listener()));
    expect(gallery.dataset.running).toBe("true");
  });

  it("keeps one keyboard link per real book and enough clickable copies to cover the viewport", () => {
    const { gallery, links } = mount();
    expect(links).toHaveLength(books.length);
    expect(links[0].getAttribute("href")).toBe("/reading/book-0?view=home");
    const tracks = gallery.querySelectorAll("[data-book-track]");
    expect(tracks).toHaveLength(3);
    tracks.forEach(track => expect(track.children).toHaveLength(3));
    const copy = gallery.querySelector<HTMLAnchorElement>('a[aria-hidden="true"]')!;
    expect(copy.tabIndex).toBe(-1);
    expect(copy.getAttribute("href")).toBe("/reading/book-0?view=home");
    expect(fireEvent.mouseDown(copy)).toBe(false);
    act(() => copy.focus());
    expect(document.activeElement).not.toBe(copy);
  });

  it("remembers the homepage position for ordinary book clicks, including copies, but leaves new-tab clicks untouched", () => {
    vi.spyOn(window, "scrollY", "get").mockReturnValue(3663);
    const { container, gallery, links } = mount();
    container.addEventListener("click", event => event.preventDefault());
    fireEvent.click(links[0], { metaKey: true });
    expect(sessionStorage.length).toBe(0);
    fireEvent.click(links[0]);
    expect(sessionStorage.getItem("silence:list-position:/")).toBe("3663");
    vi.spyOn(window, "scrollY", "get").mockReturnValue(3783);
    const copy = gallery.querySelector<HTMLAnchorElement>('a[aria-hidden="true"]')!;
    fireEvent.click(copy);
    expect(sessionStorage.getItem("silence:list-position:/")).toBe("3783");
  });

  it("cleans up timers and media listeners on unmount, and skips missing covers", () => {
    const { links, unmount } = mount();
    move(links[0], 100);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(motionListeners.size).toBe(0);
    const { container } = render(<BookRows books={[{ slug: "no-cover", title: "无封面" }]} />);
    expect(container.childElementCount).toBe(0);
  });
});
