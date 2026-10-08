// @vitest-environment jsdom

import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePhotoViewport } from "@/components/work/use-photo-viewport";

type ViewportOptions = Parameters<typeof usePhotoViewport>[0];
type ViewportSnapshot = {
  scale: number;
  position: { x: number; y: number };
  isDragging: boolean;
};

function ViewportHarness(props: ViewportOptions) {
  const viewport = usePhotoViewport(props);
  return (
    <div
      ref={viewport.containerRef}
      data-testid="viewport"
      onMouseMove={viewport.handleMouseMove}
      onMouseUp={viewport.handleMouseUp}
      onMouseLeave={viewport.handleMouseUp}
      onTouchStart={viewport.handleTouchStart}
      onTouchMove={viewport.handleTouchMove}
      onTouchEnd={viewport.handleTouchEnd}
    >
      <button onClick={viewport.handleZoomIn}>Zoom in</button>
      <button onClick={viewport.handleZoomOut}>Zoom out</button>
      <button onClick={viewport.resetView}>Fit</button>
      <button onClick={viewport.handleZoom100}>100%</button>
      <div data-testid="photo" onMouseDown={viewport.handleMouseDown} />
      <output data-testid="state">
        {JSON.stringify({
          scale: viewport.scale,
          position: viewport.position,
          isDragging: viewport.isDragging,
        })}
      </output>
    </div>
  );
}

function renderViewport(options: Partial<ViewportOptions> = {}) {
  const props: ViewportOptions = { src: "first.jpg", onClose: vi.fn(), ...options };
  const rendered = render(<ViewportHarness {...props} />, { wrapper: StrictMode });
  const container = screen.getByTestId("viewport");
  Object.defineProperties(container, {
    clientWidth: { configurable: true, value: 800 },
    clientHeight: { configurable: true, value: 600 },
  });
  vi.spyOn(container, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 50, 800, 600));
  return { ...rendered, container, props };
}

function snapshot(): ViewportSnapshot {
  return JSON.parse(screen.getByTestId("state").textContent!);
}

function zoomAndPan(container: HTMLElement) {
  fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
  fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
  fireEvent.mouseDown(screen.getByTestId("photo"), { clientX: 100, clientY: 100 });
  fireEvent.mouseMove(container, { clientX: 300, clientY: 220 });
  fireEvent.mouseUp(container);
  expect(snapshot()).toMatchObject({ scale: 2, position: { x: 200, y: 120 } });
}

function wheel(container: HTMLElement, options: WheelEventInit) {
  const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, ...options });
  fireEvent(container, event);
  return event;
}

function touches(distance: number) {
  return [{ clientX: 200, clientY: 200 }, { clientX: 200 + distance, clientY: 200 }];
}

afterEach(cleanup);

describe("usePhotoViewport", () => {
  it.each([
    { distance: 100, scale: 1 },
    { distance: 50, scale: 0.5 },
  ])("recenters a zoomed and panned photo when touch pinch reaches scale $scale", ({ distance, scale }) => {
    const { container } = renderViewport();
    zoomAndPan(container);

    fireEvent.touchStart(container, {
      touches: [{ clientX: 200, clientY: 200 }, { clientX: 400, clientY: 200 }],
    });
    fireEvent.touchMove(container, {
      touches: touches(distance),
    });

    expect(snapshot()).toMatchObject({ scale, position: { x: 0, y: 0 } });
  });

  it("clamps the existing offset to the smaller bounds when zooming out above 100%", () => {
    const { container } = renderViewport();
    zoomAndPan(container);
    fireEvent.mouseDown(screen.getByTestId("photo"), { clientX: 300, clientY: 220 });
    fireEvent.mouseMove(container, { clientX: 900, clientY: 920 });
    fireEvent.mouseUp(container);
    expect(snapshot().position).toEqual({ x: 400, y: 300 });

    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));

    expect(snapshot()).toMatchObject({ scale: 1.5, position: { x: 200, y: 150 } });
  });

  it("uses half-step zoom buttons and enforces both scale limits", () => {
    renderViewport();
    expect(snapshot()).toEqual({ scale: 1, position: { x: 0, y: 0 }, isDragging: false });
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(snapshot().scale).toBe(1.5);
    for (let index = 0; index < 12; index++) {
      fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    }
    expect(snapshot().scale).toBe(5);
    for (let index = 0; index < 12; index++) {
      fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    }
    expect(snapshot()).toMatchObject({ scale: 0.5, position: { x: 0, y: 0 } });
  });

  it.each(["Fit", "100%"])("recenters the view with the %s button", (name) => {
    const { container } = renderViewport();
    zoomAndPan(container);

    fireEvent.click(screen.getByRole("button", { name }));

    expect(snapshot()).toMatchObject({ scale: 1, position: { x: 0, y: 0 } });
  });

  it("recenters when a zoom-out button crosses 100%", () => {
    const { container } = renderViewport();
    zoomAndPan(container);
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(snapshot()).toMatchObject({ scale: 1, position: { x: 0, y: 0 } });
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(snapshot()).toMatchObject({ scale: 0.5, position: { x: 0, y: 0 } });
  });

  it.each([
    { deltaY: -50, deltaMode: 0 },
    { deltaY: -1, deltaMode: 1 },
    { deltaY: -1, deltaMode: 2 },
  ])("uses 0.2 mouse-wheel steps for $deltaMode/$deltaY", (options) => {
    const { container } = renderViewport();
    const event = wheel(container, options);
    expect(event.defaultPrevented).toBe(true);
    expect(snapshot().scale).toBeCloseTo(1.2);
    wheel(container, { ...options, deltaY: -options.deltaY });
    expect(snapshot()).toMatchObject({ scale: 1, position: { x: 0, y: 0 } });
  });

  it("clamps mouse-wheel zoom and recenters below 100%", () => {
    const { container } = renderViewport();
    zoomAndPan(container);
    for (let index = 0; index < 30; index++) wheel(container, { deltaY: -100 });
    expect(snapshot().scale).toBe(5);
    for (let index = 0; index < 30; index++) wheel(container, { deltaY: 100 });
    expect(snapshot()).toMatchObject({ scale: 0.5, position: { x: 0, y: 0 } });
  });

  it("ignores fine trackpad movement until zoomed in", () => {
    const { container } = renderViewport();
    const event = wheel(container, { deltaX: 15, deltaY: 49, deltaMode: 0 });
    expect(event.defaultPrevented).toBe(false);
    expect(snapshot()).toMatchObject({ scale: 1, position: { x: 0, y: 0 } });
  });

  it("pans fine trackpad input using the current scale and clamps both axes", () => {
    const { container } = renderViewport();
    zoomAndPan(container);
    const event = wheel(container, { deltaX: 20, deltaY: 10 });
    expect(event.defaultPrevented).toBe(true);
    expect(snapshot().position).toEqual({ x: 180, y: 110 });
    for (let index = 0; index < 20; index++) wheel(container, { deltaX: -40, deltaY: -40 });
    expect(snapshot().position).toEqual({ x: 400, y: 300 });
    for (let index = 0; index < 30; index++) wheel(container, { deltaX: 40, deltaY: 40 });
    expect(snapshot().position).toEqual({ x: -400, y: -300 });
  });

  it("keeps the ctrl-wheel anchor at the same image point", () => {
    const { container } = renderViewport();
    zoomAndPan(container);
    const before = snapshot();
    const event = wheel(container, { ctrlKey: true, deltaY: -5, clientX: 550, clientY: 380 });
    const after = snapshot();
    expect(event.defaultPrevented).toBe(true);
    expect(after.scale).toBeCloseTo(before.scale * Math.exp(0.1));
    expect((50 - after.position.x) / after.scale).toBeCloseTo((50 - before.position.x) / before.scale);
    expect((30 - after.position.y) / after.scale).toBeCloseTo((30 - before.position.y) / before.scale);
  });

  it("clamps the ctrl-wheel anchor to viewport bounds", () => {
    const { container } = renderViewport();
    wheel(container, { ctrlKey: true, deltaY: -5, clientX: 1500, clientY: -1000 });
    const { scale, position } = snapshot();
    expect(position.x).toBeCloseTo(-800 * (scale - 1) / 2);
    expect(position.y).toBeCloseTo(600 * (scale - 1) / 2);
  });

  it("caps ctrl-wheel zoom at both limits and recenters when shrinking", () => {
    const { container } = renderViewport();
    zoomAndPan(container);
    wheel(container, { ctrlKey: true, deltaY: -1000, clientX: 500, clientY: 350 });
    expect(snapshot().scale).toBe(5);
    const positionAtLimit = snapshot().position;
    wheel(container, { ctrlKey: true, deltaY: -10, clientX: 550, clientY: 400 });
    expect(snapshot().position).toEqual(positionAtLimit);
    wheel(container, { ctrlKey: true, deltaY: 1000, clientX: 550, clientY: 400 });
    expect(snapshot()).toMatchObject({ scale: 0.5, position: { x: 0, y: 0 } });
  });

  it("applies batched wheel zoom and pan actions to one current viewport", () => {
    const { container } = renderViewport();
    zoomAndPan(container);
    act(() => {
      container.dispatchEvent(new WheelEvent("wheel", { deltaY: -100, cancelable: true }));
      container.dispatchEvent(new WheelEvent("wheel", { deltaX: 10, deltaY: 20, cancelable: true }));
      container.dispatchEvent(new WheelEvent("wheel", { ctrlKey: true, deltaY: -5, clientX: 500, clientY: 350, cancelable: true }));
    });
    const factor = Math.exp(0.1);
    expect(snapshot().scale).toBeCloseTo(2.2 * factor);
    expect(snapshot().position.x).toBeCloseTo(190 * factor);
    expect(snapshot().position.y).toBeCloseTo(100 * factor);
  });

  it("does not drop a pan queued immediately after zooming in from 100%", () => {
    const { container } = renderViewport();
    act(() => {
      container.dispatchEvent(new WheelEvent("wheel", { deltaY: -100, cancelable: true }));
      container.dispatchEvent(new WheelEvent("wheel", { deltaX: 10, deltaY: 20, cancelable: true }));
    });
    expect(snapshot()).toMatchObject({ scale: 1.2, position: { x: -10, y: -20 } });
  });

  it("uses the existing keyboard shortcuts and half-step increments", () => {
    renderViewport();
    fireEvent.keyDown(document, { key: "+" });
    expect(snapshot().scale).toBe(1.5);
    fireEvent.keyDown(document, { key: "=" });
    expect(snapshot().scale).toBe(2);
    fireEvent.keyDown(document, { key: "-" });
    expect(snapshot().scale).toBe(1.5);
  });

  it.each(["0", "1"])("recenters with the %s keyboard shortcut", (key) => {
    const { container } = renderViewport();
    zoomAndPan(container);
    fireEvent.keyDown(document, { key });
    expect(snapshot()).toMatchObject({ scale: 1, position: { x: 0, y: 0 } });
  });

  it.each(["ArrowLeft", "ArrowRight"])("resets before navigation with %s", (key) => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const { container } = renderViewport({ onPrev, onNext });
    zoomAndPan(container);
    fireEvent.keyDown(document, { key });
    expect(key === "ArrowLeft" ? onPrev : onNext).toHaveBeenCalledTimes(1);
    expect(key === "ArrowLeft" ? onNext : onPrev).not.toHaveBeenCalled();
    expect(snapshot()).toMatchObject({ scale: 1, position: { x: 0, y: 0 } });
  });

  it("leaves the viewport unchanged when keyboard navigation is unavailable", () => {
    const { container } = renderViewport();
    zoomAndPan(container);
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(snapshot()).toMatchObject({ scale: 2, position: { x: 200, y: 120 } });
  });

  it("calls the latest close callback for Escape", () => {
    const firstClose = vi.fn();
    const nextClose = vi.fn();
    const { rerender, props } = renderViewport({ onClose: firstClose });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(firstClose).toHaveBeenCalledTimes(1);
    rerender(<ViewportHarness {...props} onClose={nextClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(firstClose).toHaveBeenCalledTimes(1);
    expect(nextClose).toHaveBeenCalledTimes(1);
  });

  it("does not start mouse dragging at or below 100%", () => {
    const { container } = renderViewport();
    fireEvent.mouseDown(screen.getByTestId("photo"), { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(container, { clientX: 700, clientY: 700 });
    expect(snapshot()).toEqual({ scale: 1, position: { x: 0, y: 0 }, isDragging: false });
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    fireEvent.mouseDown(screen.getByTestId("photo"), { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(container, { clientX: 700, clientY: 700 });
    expect(snapshot()).toEqual({ scale: 0.5, position: { x: 0, y: 0 }, isDragging: false });
  });

  it.each(["mouseUp", "mouseLeave"] as const)("stops a clamped mouse drag on %s", (endEvent) => {
    const { container } = renderViewport();
    zoomAndPan(container);
    fireEvent.mouseDown(screen.getByTestId("photo"), { clientX: 300, clientY: 220 });
    expect(snapshot().isDragging).toBe(true);
    fireEvent.mouseMove(container, { clientX: -1000, clientY: -1000 });
    expect(snapshot().position).toEqual({ x: -400, y: -300 });
    fireEvent[endEvent](container);
    expect(snapshot().isDragging).toBe(false);
    fireEvent.mouseMove(container, { clientX: 400, clientY: 300 });
    expect(snapshot().position).toEqual({ x: -400, y: -300 });
  });

  it("uses successive touch distances and clamps touch pinch to both limits", () => {
    const { container } = renderViewport();
    fireEvent.touchStart(container, { touches: touches(100) });
    fireEvent.touchMove(container, { touches: touches(200) });
    expect(snapshot().scale).toBe(2);
    fireEvent.touchMove(container, { touches: touches(300) });
    expect(snapshot().scale).toBe(3);
    fireEvent.touchMove(container, { touches: touches(1000) });
    expect(snapshot().scale).toBe(5);
    fireEvent.touchMove(container, { touches: touches(50) });
    expect(snapshot()).toMatchObject({ scale: 0.5, position: { x: 0, y: 0 } });
  });

  it("clamps a touch pinch offset while still above 100%", () => {
    const { container } = renderViewport();
    zoomAndPan(container);
    fireEvent.touchStart(container, { touches: touches(200) });
    fireEvent.touchMove(container, { touches: touches(125) });
    expect(snapshot()).toMatchObject({ scale: 1.25, position: { x: 100, y: 75 } });
  });

  it.each([
    { deltaX: -51, deltaY: 79, direction: "next" },
    { deltaX: 51, deltaY: -79, direction: "prev" },
    { deltaX: -50, deltaY: 0, direction: "none" },
    { deltaX: 50, deltaY: 0, direction: "none" },
    { deltaX: -100, deltaY: 80, direction: "none" },
    { deltaX: 100, deltaY: -80, direction: "none" },
  ])("keeps swipe thresholds at >50 horizontally and <80 vertically ($deltaX/$deltaY)", ({ deltaX, deltaY, direction }) => {
    const onNext = vi.fn();
    const onPrev = vi.fn();
    const { container } = renderViewport({ onNext, onPrev });
    zoomAndPan(container);
    fireEvent.touchStart(container, { touches: [{ clientX: 200, clientY: 200 }] });
    const end = { changedTouches: [{ clientX: 200 + deltaX, clientY: 200 + deltaY }] };
    fireEvent.touchEnd(container, end);
    fireEvent.touchEnd(container, end);
    expect(onNext).toHaveBeenCalledTimes(direction === "next" ? 1 : 0);
    expect(onPrev).toHaveBeenCalledTimes(direction === "prev" ? 1 : 0);
    expect(snapshot()).toMatchObject(direction === "none"
      ? { scale: 2, position: { x: 200, y: 120 } }
      : { scale: 1, position: { x: 0, y: 0 } });
  });

  it("does not mistake a finished pinch for a swipe", () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();
    const { container } = renderViewport({ onNext, onPrev });
    fireEvent.touchStart(container, { touches: touches(100) });
    fireEvent.touchMove(container, { touches: touches(200) });
    fireEvent.touchEnd(container, { changedTouches: [{ clientX: 500, clientY: 0 }] });
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
    expect(snapshot().scale).toBe(2);
  });

  it("resets scale and offset when src changes but not on an unchanged src", () => {
    const { container, rerender, props } = renderViewport();
    zoomAndPan(container);
    rerender(<ViewportHarness {...props} />);
    expect(snapshot()).toMatchObject({ scale: 2, position: { x: 200, y: 120 } });
    rerender(<ViewportHarness {...props} src="second.jpg" />);
    expect(snapshot()).toMatchObject({ scale: 1, position: { x: 0, y: 0 } });
  });

  it("removes native wheel and keyboard listeners on unmount", () => {
    const onClose = vi.fn();
    const onNext = vi.fn();
    const { container, unmount } = renderViewport({ onClose, onNext });
    expect(wheel(container, { deltaY: -100 }).defaultPrevented).toBe(true);
    unmount();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(onClose).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
    expect(wheel(container, { deltaY: -100 }).defaultPrevented).toBe(false);
  });
});
