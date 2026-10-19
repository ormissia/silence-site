// @vitest-environment jsdom

import { StrictMode, useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PhotoLightbox } from "@/components/work/photo-lightbox";

const animation = vi.hoisted(() => ({ finish: () => {}, reduced: false }));
vi.mock("framer-motion", async () => {
  const React = await import("react");
  return {
    useReducedMotion: () => animation.reduced,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: { div: React.forwardRef<HTMLDivElement, Record<string, unknown>>(function MotionDiv(props, ref) {
      const { initial, animate, exit, transition, variants, custom, onAnimationComplete, ...dom } = props;
      if ("data-lightbox-frame" in props) animation.finish = onAnimationComplete as () => void;
      return <div {...dom} ref={ref} />;
    }) },
  };
});

function Gallery({ onClose, count = 2 }: { onClose: () => void; count?: number }) {
  const [index, setIndex] = useState<number | null>(null);
  const getThumbnail = (value: number) => document.querySelector<HTMLImageElement>(`[data-thumbnail="${value}"]`);
  return <>
    {Array.from({ length: count }, (_, value) => <button key={value} onClick={() => setIndex(value)} aria-label={`Open ${value}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img data-thumbnail={value} alt="" />
    </button>)}
    {index !== null && <PhotoLightbox src={`/${index}.jpg`} previewSrc={`/${index}-preview.jpg`} alt={`Photo ${index}`}
      width={1500} height={1000} index={index} total={count} getThumbnail={getThumbnail}
      onClose={() => { setIndex(null); onClose(); }}
      onPrev={count > 1 ? () => setIndex(value => (value! + count - 1) % count) : undefined}
      onNext={count > 1 ? () => setIndex(value => (value! + 1) % count) : undefined} />}
  </>;
}

beforeEach(() => {
  animation.reduced = false;
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) {
    this.open = true;
    this.querySelector<HTMLButtonElement>("[aria-label='关闭']")?.focus();
  } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
  vi.stubGlobal("Image", class {
    src = ""; complete = true; naturalWidth = 1500; decoding = "";
    decode = () => Promise.resolve();
  });
});
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
  Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});

describe("PhotoLightbox interaction lifecycle", () => {
  it("waits for the closing animation, ignores repeated close requests and restores focus", async () => {
    const onClose = vi.fn();
    render(<Gallery onClose={onClose} />, { wrapper: StrictMode });
    fireEvent.click(screen.getByRole("button", { name: "Open 0" }));
    expect(screen.getByRole("dialog", { name: "Photo 0" })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "关闭" }));
    act(() => animation.finish());
    fireEvent.click(screen.getByRole("button", { name: "放大" }));
    expect(screen.getByText("150%")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(document, { key: "+" });
    expect(screen.getByText("100%")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "下一张" }).disabled).toBe(true);
    await act(async () => animation.finish());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Open 0" }));
  });

  it("keeps the dialog mounted across keyboard navigation, resets zoom and cycles in both directions", async () => {
    render(<Gallery onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Open 0" }));
    const dialog = screen.getByRole("dialog");
    act(() => animation.finish());
    fireEvent.click(screen.getByRole("button", { name: "放大" }));
    await act(async () => fireEvent.keyDown(document, { key: "ArrowLeft" }));
    expect(screen.getByRole("dialog", { name: "Photo 1" })).toBe(dialog);
    expect(screen.getByText("100%")).toBeTruthy();
    await act(async () => fireEvent.keyDown(document, { key: "ArrowRight" }));
    expect(screen.getByRole("dialog", { name: "Photo 0" })).toBe(dialog);
  });

  it("returns focus to the current photo after changing images", async () => {
    render(<Gallery onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Open 0" }));
    act(() => animation.finish());
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "下一张" })));
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    await act(async () => animation.finish());
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Open 1" }));
  });

  it("handles one photo swipe without treating toolbar touches as navigation", async () => {
    render(<Gallery onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Open 0" }));
    act(() => animation.finish());
    const start = { touches: [{ clientX: 250, clientY: 200 }] };
    const end = { changedTouches: [{ clientX: 100, clientY: 200 }] };
    const toolbar = screen.getByRole("group", { name: "图片缩放" });
    fireEvent.touchStart(toolbar, start);
    fireEvent.touchEnd(toolbar, end);
    expect(screen.getByRole("dialog", { name: "Photo 0" })).toBeTruthy();
    const frame = document.querySelector("[data-lightbox-frame]")!;
    fireEvent.touchStart(frame, start);
    await act(async () => fireEvent.touchEnd(frame, end));
    await act(async () => fireEvent.touchEnd(frame, end));
    expect(screen.getByRole("dialog", { name: "Photo 1" })).toBeTruthy();
  });

  it("keeps single-photo viewing usable with reduced motion and no navigation controls", async () => {
    animation.reduced = true;
    render(<Gallery onClose={vi.fn()} count={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Open 0" }));
    expect(screen.queryByRole("button", { name: "下一张" })).toBeNull();
    expect(screen.queryByRole("button", { name: "上一张" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    await act(async () => animation.finish());
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
