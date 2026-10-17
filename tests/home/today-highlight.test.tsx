// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TodayHighlight } from "@/components/home/today-highlight";

vi.mock("framer-motion", () => ({
  useReducedMotion: () => false,
  useSpring: () => ({ set: () => {} }),
  motion: { button: ({ animate: _animate, initial: _initial, transition: _transition, ...props }: ComponentProps<"button"> & {
    animate?: unknown; initial?: unknown; transition?: unknown;
  }) => <button {...props} />,
  span: ({ animate: _animate, initial: _initial, transition: _transition, style: _style, ...props }: ComponentProps<"span"> & {
    animate?: unknown; initial?: unknown; transition?: unknown;
  }) => <span {...props} /> },
}));
vi.mock("@/components/media/reveal-image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  RevealImage: ({ fill: _fill, ...props }: ComponentProps<"img"> & { fill?: boolean }) => <img {...props} />,
}));
vi.mock("@/lib/oss", () => ({ buildSrc: (src: string) => src }));

const books = [
  { slug: "a", title: "甲书", author: "甲", cover: "/a.jpg", coverRotation: -2, highlights: ["第一条划线的完整文字。", "第二条很长的划线。".repeat(60)] },
  { slug: "b", title: "乙书", cover: "/b.jpg", coverRotation: 3, highlights: ["乙书唯一的一条划线。"] },
];
let width = 1100;
const scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const enter = (element: Element) => fireEvent.pointerEnter(element, { pointerType: "mouse" });
const leave = (element: Element) => fireEvent.pointerLeave(element, { pointerType: "mouse" });

beforeEach(() => {
  vi.useFakeTimers();
  width = 1100;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => new DOMRect(0, 0, width, 600));
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    pointerType: string;
    constructor(type: string, options: PointerEventInit) { super(type, options); this.pointerType = options.pointerType ?? "mouse"; }
  });
});
afterEach(() => {
  cleanup(); vi.clearAllTimers(); vi.useRealTimers();
  if (scrollIntoViewDescriptor) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", scrollIntoViewDescriptor);
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});

function mount() {
  const view = render(<TodayHighlight books={books} />);
  return { ...view, covers: view.getAllByRole("button", { name: /^展开/ }) };
}

describe("homepage radial highlights", () => {
  it("keeps notes open across the cover gap, enlarges hovered notes and closes only after leaving", () => {
    const { covers, getAllByRole, queryByRole } = mount();
    enter(covers[0]);
    const notes = getAllByRole("button", { name: /^划线/ });
    expect(notes).toHaveLength(2);
    leave(covers[0]);
    advance(200);
    enter(notes[0]);
    advance(500);
    expect(covers[0].getAttribute("aria-expanded")).toBe("true");
    expect(notes[0].getAttribute("aria-expanded")).toBe("true");
    leave(notes[0]);
    advance(180);
    enter(notes[1]);
    expect(notes[1].getAttribute("aria-expanded")).toBe("true");
    expect(notes[0].getAttribute("aria-expanded")).toBe("false");
    fireEvent.keyDown(notes[1], { key: "Control" });
    leave(notes[1]);
    advance(240);
    expect(queryByRole("region")).toBeNull();
    expect(covers[0].getAttribute("aria-expanded")).toBe("false");
  });

  it("cancels a pending close when returning to the cover or switching books", () => {
    const { covers, getAllByRole, queryByRole } = mount();
    enter(covers[0]); leave(covers[0]); advance(180); enter(covers[0]); advance(300);
    expect(covers[0].getAttribute("aria-expanded")).toBe("true");
    leave(covers[0]); enter(covers[1]); advance(400);
    expect(covers[0].getAttribute("aria-expanded")).toBe("false");
    expect(getAllByRole("button", { name: /^划线/ })).toHaveLength(1);
    expect(queryByRole("region", { name: "《甲书》的划线笔记" })).toBeNull();
  });

  it("moves focus out of an old note when hovering a different book", () => {
    const { covers, getAllByRole } = mount();
    act(() => covers[0].focus());
    act(() => getAllByRole("button", { name: /^划线/ })[0].focus());
    enter(covers[1]);
    expect(document.activeElement).toBe(covers[1]);
    expect(covers[1].getAttribute("aria-expanded")).toBe("true");
  });

  it("supports focus, reading a long note, Escape and focus leaving the component", () => {
    const { covers, getAllByRole, queryByRole } = mount();
    act(() => covers[0].focus());
    const note = getAllByRole("button", { name: /^划线/ })[1];
    act(() => note.focus());
    expect(note.getAttribute("aria-expanded")).toBe("true");
    const scroll = vi.fn();
    Object.defineProperty(note.querySelector("[data-note-text]"), "scrollBy", { value: scroll, configurable: true });
    fireEvent.keyDown(note, { key: "ArrowDown" });
    expect(scroll).toHaveBeenCalledWith({ top: 60 });
    fireEvent.keyDown(note, { key: "Escape" });
    expect(document.activeElement).toBe(covers[0]);
    expect(queryByRole("region")).toBeNull();
    fireEvent.click(covers[0]);
    fireEvent.blur(covers[0], { relatedTarget: document.body });
    expect(queryByRole("region")).toBeNull();
  });

  it("supports touch activation, note expansion and outside dismissal without a close control", () => {
    width = 360;
    const { covers, getByRole, queryByRole, getByText } = mount();
    fireEvent.pointerDown(covers[0], { pointerType: "touch" });
    fireEvent.click(covers[0]);
    fireEvent.pointerLeave(covers[0], { pointerType: "touch" });
    advance(1000);
    const note = getByRole("button", { name: /^划线 1/ });
    fireEvent.click(note);
    expect(note.getAttribute("aria-expanded")).toBe("true");
    expect(queryByRole("button", { name: /收起笔记/ })).toBeNull();
    fireEvent.pointerDown(document.body, { pointerType: "touch" });
    expect(queryByRole("region")).toBeNull();
    fireEvent.click(covers[0]);
    fireEvent.pointerDown(getByText("书页里的回声"), { pointerType: "touch" });
    expect(queryByRole("region")).toBeNull();
  });

  it("cleans pending timers, omits captions, and handles missing images and empty content", () => {
    const { covers, unmount, getByRole, queryByText } = mount();
    expect(queryByText("甲书")).toBeNull();
    expect(queryByText("甲")).toBeNull();
    fireEvent.error(getByRole("img", { name: "甲书" }));
    expect(covers[0].textContent).toBe("甲书");
    enter(covers[0]); leave(covers[0]); unmount();
    expect(vi.getTimerCount()).toBe(0);
    const empty = render(<TodayHighlight books={[]} />);
    expect(empty.getByText("还没有可以展示的划线笔记。")).toBeTruthy();
  });
});
