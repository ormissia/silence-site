// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLightboxPhoto, type LightboxPhotoSource } from "@/components/work/use-lightbox-photo";
import { fitPhoto } from "@/components/work/lightbox-geometry";

class PendingImage {
  src = "";
  decoding = "";
  complete = false;
  naturalWidth = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  decode = vi.fn().mockResolvedValue(undefined);
  constructor() { requests.push(this); }
}
let requests: PendingImage[];
const photo = (index: number): LightboxPhotoSource => ({ index, src: `/${index}.jpg`, previewSrc: `/${index}-preview.jpg`, alt: `Photo ${index}`, width: 1500, height: 1000 });

beforeEach(() => { requests = []; vi.stubGlobal("Image", PendingImage); });
afterEach(cleanup);

async function loaded(src: string) {
  const image = requests.find(request => request.src === src)!;
  image.naturalWidth = 1500;
  image.complete = true;
  await act(async () => { image.onload?.(); });
}

describe("lightbox photo handoff", () => {
  it("keeps the visible photo until the next preview has decoded", async () => {
    const { result, rerender } = renderHook(({ requested }) => useLightboxPhoto(requested, true), { initialProps: { requested: photo(0) } });
    rerender({ requested: photo(1) });
    expect(result.current.displayed.src).toBe("/0.jpg");
    expect(result.current.pending).toBe(true);
    await loaded("/1-preview.jpg");
    expect(result.current.displayed).toEqual(photo(1));
    expect(result.current.pending).toBe(false);
  });

  it("can use the full image as its decoded fallback when it arrives first", async () => {
    const { result, rerender } = renderHook(({ requested }) => useLightboxPhoto(requested, true), { initialProps: { requested: photo(0) } });
    rerender({ requested: photo(1) });
    await loaded("/1.jpg");
    expect(result.current.displayed.previewSrc).toBe("/1.jpg");
  });

  it("does not let an older decode overwrite a more recent navigation", async () => {
    const { result, rerender } = renderHook(({ requested }) => useLightboxPhoto(requested, true), { initialProps: { requested: photo(0) } });
    rerender({ requested: photo(1) });
    let finishDecode!: () => void;
    requests[0].decode.mockImplementation(() => new Promise<void>(resolve => { finishDecode = resolve; }));
    await loaded("/1-preview.jpg");
    expect(result.current.displayed.index).toBe(0);
    rerender({ requested: photo(2) });
    await loaded("/2-preview.jpg");
    await act(async () => finishDecode());
    expect(result.current.displayed.index).toBe(2);
  });

  it("retains the displayed photo if both requested image sizes fail", () => {
    const { result, rerender } = renderHook(({ requested }) => useLightboxPhoto(requested, true), { initialProps: { requested: photo(0) } });
    rerender({ requested: photo(1) });
    act(() => requests.forEach(request => request.onerror?.()));
    expect(result.current.displayed.index).toBe(0);
    expect(result.current.failed).toBe(true);
  });

  it("freezes the displayed photo when closing during a pending decode", async () => {
    const { result, rerender } = renderHook(({ requested, enabled }) => useLightboxPhoto(requested, enabled), { initialProps: { requested: photo(0), enabled: true } });
    rerender({ requested: photo(1), enabled: true });
    const lateLoad = requests[0].onload;
    requests[0].naturalWidth = 1500;
    rerender({ requested: photo(1), enabled: false });
    await act(async () => lateLoad?.());
    expect(result.current.displayed.index).toBe(0);
    expect(result.current.pending).toBe(false);
  });
});

describe("lightbox image fitting", () => {
  it.each([[4000, 1000, 1280, 720], [2000, 3000, 390, 844], [1000, 1000, 320, 568]])(
    "preserves %s × %s within a %s × %s viewport", (width, height, viewportWidth, viewportHeight) => {
      const frame = fitPhoto(width, height, viewportWidth, viewportHeight);
      expect(frame.width / frame.height).toBeCloseTo(width / height);
      expect(frame.x).toBeGreaterThanOrEqual(16);
      expect(frame.y).toBeGreaterThanOrEqual(72);
      expect(frame.x + frame.width).toBeLessThanOrEqual(viewportWidth - 16);
      expect(frame.y + frame.height).toBeLessThanOrEqual(viewportHeight - 72);
    }
  );
});
