// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { arriveCoverTransition, beginCoverTransition, cancelCoverTransition, checkCoverTransitionRoute } from "@/components/work/cover-transition";

type Rect = [left: number, top: number, width: number, height: number];
type Motion = { element: HTMLElement; finish: () => void; cancel: ReturnType<typeof vi.fn> };
let motions: Motion[];
let media: EventTarget & { matches: boolean };

function bounds(element: HTMLElement, [left, top, width, height]: Rect) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ left, top, width, height,
    right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) });
}

function cover(rect: Rect, hero = false, loaded = true) {
  const element = document.createElement(hero ? "header" : "div");
  const image = document.createElement("img");
  image.src = "/cover.jpg";
  if (hero) image.dataset.workHeroImage = "";
  else element.dataset.workCover = "";
  Object.defineProperties(image, {
    complete: { value: loaded }, naturalWidth: { value: loaded ? 1500 : 0 }, naturalHeight: { value: loaded ? 1000 : 0 },
  });
  image.decode = vi.fn().mockResolvedValue(undefined);
  element.append(image);
  document.body.append(element);
  bounds(element, rect);
  bounds(image, rect);
  return { element, image };
}

async function settleLayout() { await vi.advanceTimersByTimeAsync(40); }
async function finishMotion() {
  motions.slice().forEach(motion => motion.finish());
  await vi.advanceTimersByTimeAsync(0);
}

beforeEach(() => {
  vi.useFakeTimers();
  motions = [];
  media = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal("matchMedia", () => media);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 16));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
  vi.stubGlobal("innerHeight", 1000);
  Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: vi.fn(function (this: HTMLElement) {
    let finish!: () => void;
    const finished = new Promise<void>(resolve => { finish = resolve; });
    const cancel = vi.fn(() => finish());
    motions.push({ element: this, finish, cancel });
    return { finished, cancel } as unknown as Animation;
  }) });
});

afterEach(() => {
  cancelCoverTransition();
  document.body.replaceChildren();
  Reflect.deleteProperty(HTMLElement.prototype, "animate");
  vi.useRealTimers();
});

describe("shared Works cover lifecycle", () => {
  it("hands off to the decoded hero and retains the marker that prevents a second image reveal", async () => {
    const source = cover([100, 300, 300, 200]);
    const target = cover([0, 0, 1000, 700], true);
    beginCoverTransition(source.element, "example");
    arriveCoverTransition(target.element, "example");
    await settleLayout();
    expect(target.element.dataset.coverArriving).toBe("true");
    expect(source.element.dataset.coverDeparting).toBe("true");
    await finishMotion();
    expect(target.element.dataset.coverReady).toBe("true");
    expect(target.element.dataset.coverTransferred).toBe("true");
    expect(document.querySelector(".work-cover-flight")).not.toBeNull();
    await finishMotion();
    expect(document.querySelector(".work-cover-flight")).toBeNull();
    expect(target.element.dataset.coverArriving).toBeUndefined();
    expect(source.element.dataset.coverDeparting).toBeUndefined();
    expect(target.element.dataset.coverTransferred).toBe("true");
  });

  it("returns to the card after scroll restoration without shrinking the hero shade on the first frame", async () => {
    const source = cover([0, 0, 1440, 900], true);
    const shade = document.createElement("div");
    shade.dataset.workCoverShade = "";
    shade.style.backgroundImage = "linear-gradient(transparent, black)";
    source.element.append(shade);
    const target = cover([100, 1400, 300, 200]);
    beginCoverTransition(source.element, "example", "return");
    arriveCoverTransition(target.element, "example", "return");
    bounds(target.element, [100, 300, 300, 200]);
    bounds(target.image, [100, 300, 300, 200]);
    await settleLayout();
    const scrim = document.querySelector<HTMLElement>(".work-cover-flight > div");
    expect(scrim?.style.width).toBe("1440px");
    expect(scrim?.style.height).toBe("900px");
    await finishMotion();
    expect(target.element.dataset.coverReady).toBe("true");
    await finishMotion();
    expect(document.querySelector(".work-cover-flight")).toBeNull();
    expect(target.element.dataset.coverTransferred).toBeUndefined();
  });

  it.each(["error", "timeout"])("falls back to normal image loading on %s without marking an undecoded image transferred", async failure => {
    const source = cover([100, 300, 300, 200]);
    const target = cover([0, 0, 1000, 700], true, false);
    beginCoverTransition(source.element, "example");
    arriveCoverTransition(target.element, "example");
    await settleLayout();
    expect(document.querySelector<HTMLImageElement>(".work-cover-flight > img")?.style.width).toBe("1050px");
    await finishMotion();
    if (failure === "error") target.image.dispatchEvent(new Event("error"));
    else await vi.advanceTimersByTimeAsync(1200);
    await vi.advanceTimersByTimeAsync(0);
    expect(document.querySelector(".work-cover-flight")).toBeNull();
    expect(target.element.dataset.coverTransferred).toBeUndefined();
    expect(target.element.dataset.coverArriving).toBeUndefined();
  });

  it("survives Strict Mode's target cleanup and reconnection", async () => {
    const source = cover([100, 300, 300, 200]);
    const target = cover([0, 0, 1000, 700], true);
    beginCoverTransition(source.element, "example");
    const disconnect = arriveCoverTransition(target.element, "example");
    disconnect?.();
    arriveCoverTransition(target.element, "example");
    await settleLayout();
    expect(document.querySelector(".work-cover-flight")).not.toBeNull();
    await finishMotion();
    await finishMotion();
    expect(target.element.dataset.coverTransferred).toBe("true");
  });

  it("does not let a departing route's deferred cleanup cancel a newer flight", async () => {
    const source = cover([100, 300, 300, 200]);
    const target = cover([0, 0, 1000, 700], true);
    beginCoverTransition(source.element, "first");
    const disconnect = arriveCoverTransition(target.element, "first");
    disconnect?.();
    beginCoverTransition(source.element, "second");
    await vi.advanceTimersByTimeAsync(0);
    expect(document.querySelectorAll(".work-cover-flight")).toHaveLength(1);
    expect(source.element.dataset.coverDeparting).toBe("true");
  });

  it.each(["wheel", "resize", "popstate"])("restores real content when %s interrupts a flight", async event => {
    const source = cover([100, 300, 300, 200]);
    const target = cover([0, 0, 1000, 700], true);
    beginCoverTransition(source.element, "example");
    arriveCoverTransition(target.element, "example");
    await settleLayout();
    window.dispatchEvent(new Event(event));
    expect(document.querySelector(".work-cover-flight")).toBeNull();
    expect(source.element.dataset.coverDeparting).toBeUndefined();
    expect(target.element.dataset.coverArriving).toBeUndefined();
    expect(motions.every(motion => motion.cancel.mock.calls.length === 1)).toBe(true);
  });

  it("cleans up navigation that never arrives or goes elsewhere", async () => {
    const source = cover([100, 300, 300, 200]);
    beginCoverTransition(source.element, "example");
    await vi.advanceTimersByTimeAsync(3500);
    expect(source.element.dataset.coverDeparting).toBeUndefined();
    beginCoverTransition(source.element, "example");
    checkCoverTransitionRoute("/journal");
    expect(document.querySelector(".work-cover-flight")).toBeNull();
  });

  it("respects reduced motion without hiding the source", () => {
    media.matches = true;
    const source = cover([100, 300, 300, 200]);
    beginCoverTransition(source.element, "example");
    expect(document.querySelector(".work-cover-flight")).toBeNull();
    expect(source.element.dataset.coverDeparting).toBeUndefined();
  });
});
