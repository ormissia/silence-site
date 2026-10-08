import { describe, expect, it } from "vitest";
import {
  INITIAL_PHOTO_VIEWPORT,
  photoViewportReducer,
  type PhotoViewportAction,
  type PhotoViewportState,
} from "@/lib/photo-viewport";

const size = { width: 800, height: 600 };
const zoomed: PhotoViewportState = { scale: 2, position: { x: 200, y: 120 } };

describe("photoViewportReducer", () => {
  it("resets both scale and position", () => {
    expect(photoViewportReducer(zoomed, { type: "reset" })).toEqual(INITIAL_PHOTO_VIEWPORT);
  });

  it.each<PhotoViewportAction>([
    { type: "zoom", delta: -1, size },
    { type: "zoom", delta: -2, size },
    { type: "pinch", factor: 0.5, size },
    { type: "pinch", factor: 0.25, anchor: { x: 200, y: 100 }, size },
  ])("recenters every zoom path at or below 100%: $type", (action) => {
    const next = photoViewportReducer(zoomed, action);
    expect(next.scale).toBeGreaterThanOrEqual(0.5);
    expect(next.scale).toBeLessThanOrEqual(1);
    expect(next.position).toEqual({ x: 0, y: 0 });
  });

  it.each<PhotoViewportAction>([
    { type: "zoom", delta: 100, size },
    { type: "pinch", factor: 100, size },
  ])("caps zoom at 5 for $type", (action) => {
    expect(photoViewportReducer(zoomed, action).scale).toBe(5);
  });

  it.each<PhotoViewportAction>([
    { type: "zoom", delta: -100, size },
    { type: "pinch", factor: 0.001, size },
  ])("caps zoom at 0.5 for $type", (action) => {
    expect(photoViewportReducer(zoomed, action)).toEqual({ scale: 0.5, position: { x: 0, y: 0 } });
  });

  it("preserves offsets inside the bounds for center zoom", () => {
    expect(photoViewportReducer(zoomed, { type: "zoom", delta: 0.5, size }))
      .toEqual({ scale: 2.5, position: zoomed.position });
    expect(photoViewportReducer(zoomed, { type: "pinch", factor: 1.5, size }))
      .toEqual({ scale: 3, position: zoomed.position });
  });

  it("preserves the ctrl-wheel image point before applying edge constraints", () => {
    const anchor = { x: 50, y: 30 };
    const next = photoViewportReducer(zoomed, { type: "pinch", factor: 1.5, anchor, size });
    expect(next).toEqual({ scale: 3, position: { x: 275, y: 165 } });
    expect((anchor.x - next.position.x) / next.scale)
      .toBe((anchor.x - zoomed.position.x) / zoomed.scale);
    expect((anchor.y - next.position.y) / next.scale)
      .toBe((anchor.y - zoomed.position.y) / zoomed.scale);
  });

  it.each<PhotoViewportAction>([
    { type: "zoom", delta: -0.5, size },
    { type: "pinch", factor: 0.75, size },
    { type: "pinch", factor: 0.75, anchor: { x: 400, y: -300 }, size },
  ])("clamps existing offsets after each shrink path: $type", (action) => {
    const next = photoViewportReducer({ scale: 2, position: { x: 400, y: -300 } }, action);
    expect(next).toEqual({ scale: 1.5, position: { x: 200, y: -150 } });
  });

  it.each<PhotoViewportAction>([
    { type: "pan", delta: { x: 1000, y: -1000 }, size },
    { type: "move", position: { x: 1000, y: -1000 }, size },
  ])("clamps $type at the same container-relative boundaries", (action) => {
    expect(photoViewportReducer(zoomed, action)).toEqual({ scale: 2, position: { x: 400, y: -300 } });
  });

  it.each<PhotoViewportAction>([
    { type: "pan", delta: { x: 100, y: -100 }, size },
    { type: "move", position: { x: 100, y: -100 }, size },
  ])("does not offset an unzoomed photo for $type", (action) => {
    expect(photoViewportReducer(INITIAL_PHOTO_VIEWPORT, action)).toEqual(INITIAL_PHOTO_VIEWPORT);
    expect(photoViewportReducer({ scale: 0.5, position: { x: 0, y: 0 } }, action))
      .toEqual({ scale: 0.5, position: { x: 0, y: 0 } });
  });

  it("uses the dimensions captured for the current action", () => {
    expect(photoViewportReducer(zoomed, {
      type: "move", position: { x: 1000, y: -1000 }, size: { width: 400, height: 200 },
    })).toEqual({ scale: 2, position: { x: 200, y: -100 } });
  });

  it("retains the missing-container fallback above 100%", () => {
    expect(photoViewportReducer(zoomed, {
      type: "move", position: { x: 1000, y: -1000 }, size: null,
    })).toEqual({ scale: 2, position: { x: 1000, y: -1000 } });
    expect(photoViewportReducer(zoomed, { type: "pinch", factor: 0.25, size: null }))
      .toEqual({ scale: 0.5, position: { x: 0, y: 0 } });
  });

  it("is deterministic without mutating the input state or action", () => {
    const state = Object.freeze({ scale: 2, position: Object.freeze({ x: 200, y: 120 }) });
    const action = Object.freeze({
      type: "pinch" as const,
      factor: 1.5,
      anchor: Object.freeze({ x: 50, y: 30 }),
      size: Object.freeze({ ...size }),
    });
    const first = photoViewportReducer(state, action);
    expect(photoViewportReducer(state, action)).toEqual(first);
    expect(state).toEqual(zoomed);
    expect(action).toEqual({ type: "pinch", factor: 1.5, anchor: { x: 50, y: 30 }, size });
  });
});
