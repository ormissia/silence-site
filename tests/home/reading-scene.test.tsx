// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useReadingScene, type SceneBook } from "@/components/home/use-reading-scene";
import { requestListReturn } from "@/components/layout/list-return";

const books: SceneBook[] = [
  { slug: "a", title: "有笔记的书", cover: "/a.jpg", highlights: ["真实划线"] },
  { slug: "b", title: "没有笔记的书", cover: "/b.jpg", highlights: [] },
];
let y = 0;
let reduced = false;
let bookLeft = 450;
const mediaListeners = new Set<() => void>();
const resizes = new Set<() => void>();
const animations = Array.from({ length: 3 }, (_, index) => ({
  playbackRate: 1, currentTime: (index + 1) * 100,
  effect: { getComputedTiming: () => ({ duration: 1000 }) },
}));

function Fixture({ supplied = books }: { supplied?: SceneBook[] }) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const scene = useReadingScene(root, stage, supplied);
  return <div ref={root} data-testid="scene" data-reduced={scene.reduced} data-ready={scene.ready}>
    <button onClick={scene.save}>进入详情</button>
    <div ref={stage} data-stage>
      {[0, 1, 2].map(row => <div key={row} data-book-row={row}>
        <div data-book-track={row}>
          {scene.books.map((book, index) => <a key={book.slug} href={`/reading/${book.slug}`}
            data-book-id={`${row}:${index}:${book.slug}`} data-book-slug={book.slug} data-book-position={index} />)}
        </div>
      </div>)}
      {scene.selected && <div data-testid="selected" data-id={scene.selected.id} data-width={scene.selected.width}
        data-notes={scene.selected.book.highlights.length}>{scene.selected.book.title}</div>}
    </div>
  </div>;
}
const flush = () => act(() => vi.advanceTimersByTime(32));
function progress(value: number) {
  y = 904 + 936 * value;
  fireEvent.scroll(window);
  flush();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(window, "cancelAnimationFrame");
  y = 0; reduced = false; bookLeft = 450;
  sessionStorage.clear(); mediaListeners.clear(); resizes.clear();
  animations.forEach((animation, index) => { animation.playbackRate = 1; animation.currentTime = (index + 1) * 100; });
  document.documentElement.style.setProperty("--site-header-height", "96px");
  vi.spyOn(window, "scrollY", "get").mockImplementation(() => y);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(1536);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(600);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1000);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    if (this.dataset.testid === "scene") return new DOMRect(0, 1000 - y, 1000, 1536);
    if (this.hasAttribute("data-stage")) return new DOMRect(0, 96, 1000, 600);
    if (this.hasAttribute("data-book-position")) return new DOMRect(this.dataset.bookPosition === "1" ? bookLeft : 250, 321, 100, 150);
    return new DOMRect(0, 0, 1000, 150);
  });
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return reduced; },
    addEventListener: (_: string, callback: () => void) => mediaListeners.add(callback),
    removeEventListener: (_: string, callback: () => void) => mediaListeners.delete(callback),
  }));
  vi.stubGlobal("ResizeObserver", class {
    callback: () => void;
    constructor(callback: () => void) { this.callback = callback; resizes.add(callback); }
    observe() {}
    disconnect() { resizes.delete(this.callback); }
  });
  Object.defineProperty(HTMLElement.prototype, "getAnimations", { configurable: true, value: function (this: HTMLElement) {
    return this.hasAttribute("data-book-track") ? [animations[Number(this.dataset.bookTrack)]] : [];
  } });
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); sessionStorage.clear();
  delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations;
  document.documentElement.style.removeProperty("--site-header-height");
});

describe("continuous homepage reading scene", () => {
  it("slows all rows without restarting their phases, then keeps the nearest book even when it has no notes", () => {
    const view = render(<Fixture />); flush();
    progress(.175);
    expect(animations.map(animation => animation.playbackRate)).toEqual([.25, .25, .25]);
    expect(animations.map(animation => animation.currentTime)).toEqual([100, 200, 300]);
    expect(view.queryByTestId("selected")).toBeNull();
    progress(.36);
    expect(animations.map(animation => animation.playbackRate)).toEqual([0, 0, 0]);
    expect(view.getByTestId("selected").dataset.id).toBe("1:1:b");
    expect(view.getByTestId("selected").dataset.notes).toBe("0");
    bookLeft = 900;
    progress(.9);
    expect(view.getByTestId("selected").textContent).toBe("没有笔记的书");
    expect(view.getByTestId("scene").dataset.ready).toBe("true");
    expect(view.getByTestId("scene").style.getPropertyValue("--wall-opacity")).toBe("0");
    expect(parseFloat(view.getByTestId("scene").style.getPropertyValue("--focus-width"))).toBeGreaterThan(100);
  });

  it("reverses the composition without choosing again, resuming rows only back at the start", () => {
    const view = render(<Fixture />); flush(); progress(.95); progress(.2);
    expect(view.getByTestId("selected").dataset.id).toBe("1:1:b");
    expect(animations[1].playbackRate).toBe(0);
    expect(view.getByTestId("scene").style.getPropertyValue("--peek")).toBe("0");
    expect(view.getByTestId("scene").style.getPropertyValue("--focus-width")).toBe("100px");
    progress(0);
    expect(view.queryByTestId("selected")).toBeNull();
    expect(animations[1].playbackRate).toBe(1);
  });

  it("restores the actual book list and row phases after detail return even if the server sends new books", () => {
    const first = render(<Fixture />); flush(); progress(.9);
    animations[1].currentTime = 1450;
    first.unmount();
    sessionStorage.setItem("silence:return-to-list", "/");
    const replacement = [{ slug: "new", title: "新书", cover: "/new.jpg", highlights: ["另一条划线"] }];
    const returned = render(<Fixture supplied={replacement} />); flush();
    expect(returned.getByTestId("selected").textContent).toBe("没有笔记的书");
    expect(animations[1].currentTime).toBeCloseTo(450);
    expect(animations[1].playbackRate).toBe(0);
    returned.unmount(); sessionStorage.clear(); progress(0);
    const fresh = render(<Fixture supplied={replacement} />); flush(); progress(.9);
    expect(fresh.getByTestId("selected").textContent).toBe("新书");
  });

  it("uses a static wall and still selects the real central book with reduced motion", () => {
    reduced = true;
    const view = render(<Fixture />); flush();
    expect(view.getByTestId("scene").dataset.reduced).toBe("true");
    expect(view.getByTestId("selected").dataset.id).toBe("1:1:b");
    expect(view.getByTestId("scene").style.getPropertyValue("--wall-opacity")).toBe("1");
    expect(view.getByTestId("scene").style.getPropertyValue("--book-rotation")).toBe("0deg");
    expect(animations[1].playbackRate).toBe(0);
    fireEvent.scroll(window);
    view.unmount();
    expect(mediaListeners.size).toBe(0); expect(resizes.size).toBe(0);
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
    flush();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("preserves a navigation snapshot after the return marker was consumed and scroll restoration is delayed", () => {
    const first = render(<Fixture />); flush(); progress(.9);
    animations[1].currentTime = 1450;
    fireEvent.click(first.getByText("进入详情"));
    animations[1].currentTime = 0;
    progress(0);
    first.unmount();
    requestListReturn("/");
    sessionStorage.removeItem("silence:return-to-list");
    const returned = render(<Fixture supplied={[{ slug: "new", title: "新书", highlights: [] }]} />); flush();
    expect(returned.queryByTestId("selected")).toBeNull();
    expect(animations[1].currentTime).toBeCloseTo(450);
    progress(.9);
    expect(returned.getByTestId("selected").textContent).toBe("没有笔记的书");
    expect(animations[1].playbackRate).toBe(0);
    returned.unmount();
    const fresh = render(<Fixture supplied={[{ slug: "new", title: "新书", highlights: [] }]} />); flush();
    expect(fresh.getByTestId("selected").textContent).toBe("新书");
  });

  it("keeps the chosen slug when its loop copy disappears after a resize", () => {
    const view = render(<Fixture />); flush(); progress(.9);
    const link = view.container.querySelector<HTMLElement>('[data-book-id="1:1:b"]')!;
    link.dataset.bookId = "1:0:b";
    act(() => resizes.forEach(resize => resize())); flush();
    expect(view.getByTestId("selected").dataset.id).toBe("1:0:b");
    expect(animations[1].playbackRate).toBe(0);
  });
});
