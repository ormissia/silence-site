// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReadingFinale } from "@/components/home/reading-finale";

vi.mock("framer-motion", () => ({
  useSpring: () => ({ set: () => {} }),
  motion: {
    button: ({ animate: _animate, initial: _initial, transition: _transition, ...props }: ComponentProps<"button"> & {
      animate?: unknown; initial?: unknown; transition?: unknown;
    }) => <button {...props} />,
    span: ({ animate: _animate, initial: _initial, transition: _transition, style: _style, ...props }: ComponentProps<"span"> & {
      animate?: unknown; initial?: unknown; transition?: unknown;
    }) => <span {...props} />,
  },
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: ComponentProps<"img">) => <img {...props} />,
}));
vi.mock("next/link", () => ({
  default: ({ prefetch: _prefetch, scroll: _scroll, ...props }: ComponentProps<"a"> & {
    prefetch?: boolean; scroll?: boolean;
  }) => <a {...props} />,
}));
vi.mock("@/lib/oss", () => ({ buildSrc: (src: string) => src }));

const book = { slug: "a", title: "甲书", cover: "/a.jpg", highlights: ["第一条真实划线。", "第二条很长的划线。".repeat(60)] };
let compact = false;
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const enter = (element: Element) => fireEvent.pointerEnter(element, { pointerType: "mouse" });
const leave = (element: Element) => fireEvent.pointerLeave(element, { pointerType: "mouse" });

beforeEach(() => {
  vi.useFakeTimers(); compact = false;
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1280);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(624);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("matchMedia", () => ({ matches: compact, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    pointerType: string;
    constructor(type: string, options: PointerEventInit) { super(type, options); this.pointerType = options.pointerType ?? "mouse"; }
  });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true, value: function (this: HTMLDialogElement) { this.open = true; },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true, value: function (this: HTMLDialogElement) { this.open = false; },
  });
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllTimers(); vi.useRealTimers();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});

describe("retained book highlights", () => {
  it("keeps notes open across the cover gap and expands the hovered note", () => {
    const view = render(<ReadingFinale book={book} width={104} ready reduced={false} />);
    const cover = view.getByRole("button", { name: /^展开/ });
    enter(cover); leave(cover); advance(200);
    const notes = view.getAllByRole("button", { name: /^划线/ });
    enter(notes[0]); advance(300);
    expect(cover.getAttribute("aria-expanded")).toBe("true");
    expect(notes[0].getAttribute("aria-expanded")).toBe("true");
    leave(notes[0]); enter(notes[1]);
    expect(notes[0].getAttribute("aria-expanded")).toBe("false");
    expect(notes[1].getAttribute("aria-expanded")).toBe("true");
    expect(notes[1].querySelector("[data-note-text]")?.textContent).toBe(book.highlights[1]);
    leave(notes[1]); advance(240);
    expect(view.queryByRole("region")).toBeNull();
    expect(cover.getAttribute("aria-expanded")).toBe("false");
  });

  it("supports keyboard reading, Escape focus return, and closes when scrolling out of the finale", () => {
    const view = render(<ReadingFinale book={book} width={104} ready reduced={false} />);
    const cover = view.getByRole("button", { name: /^展开/ });
    act(() => cover.focus());
    const note = view.getAllByRole("button", { name: /^划线/ })[1];
    act(() => note.focus());
    const scroll = vi.fn();
    Object.defineProperty(note.querySelector("[data-note-text]"), "scrollBy", { value: scroll, configurable: true });
    fireEvent.keyDown(note, { key: "ArrowDown" });
    expect(scroll).toHaveBeenCalledWith({ top: 60 });
    fireEvent.keyDown(note, { key: "Escape" });
    expect(document.activeElement).toBe(cover);
    expect(view.queryByRole("region")).toBeNull();
    fireEvent.click(cover);
    view.rerender(<ReadingFinale book={book} width={104} ready={false} reduced={false} />);
    expect(view.queryByRole("region")).toBeNull();
    expect(cover.tabIndex).toBe(-1);
  });

  it("opens touch notes in a dialog and restores the peeking cards after dismissal", () => {
    compact = true;
    const view = render(<ReadingFinale book={book} width={104} ready reduced={false} />);
    const cover = view.getByRole("button", { name: /^展开/ });
    fireEvent.pointerDown(cover, { pointerType: "touch" }); fireEvent.click(cover);
    fireEvent.pointerLeave(cover, { pointerType: "touch" }); advance(500);
    const dialog = view.getByRole("dialog");
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.pointerDown(view.getByText("甲书"), { pointerType: "touch" });
    expect(view.getByRole("dialog")).toBe(dialog);
    const note = view.getAllByRole("button", { name: /^划线/ })[1];
    fireEvent.click(note);
    expect(note.getAttribute("aria-expanded")).toBe("true");
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(view.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(cover.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps a book without notes as a detail link and cleans pending interaction timers", () => {
    const view = render(<ReadingFinale book={{ ...book, highlights: [] }} width={104} ready reduced={false} />);
    expect(view.getByRole("link").getAttribute("href")).toBe("/reading/a?view=home");
    expect(view.queryByRole("button")).toBeNull();
    view.rerender(<ReadingFinale book={book} width={104} ready reduced={false} />);
    const cover = view.getByRole("button", { name: /^展开/ });
    enter(cover); leave(cover); view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
