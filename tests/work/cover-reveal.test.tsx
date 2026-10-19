// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCoverReveal } from "@/components/work/use-cover-reveal";

const transition = vi.hoisted(() => ({ returning: false }));
vi.mock("@/components/work/cover-transition", () => ({
  arriveCoverTransition: (cover: HTMLElement) => { if (transition.returning) cover.dataset.coverArriving = "true"; },
}));
let enterViewport: () => void;
let observed: Element | undefined;

function Card({ slug }: { slug: string }) {
  const ref = useCoverReveal(slug);
  return <a data-work-entry href={`/works/${slug}`}><div data-cover-bounds><div ref={ref} data-work-cover>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img alt="Cover" data-image-state="loading" />
  </div></div></a>;
}

beforeEach(() => {
  transition.returning = false;
  observed = undefined;
  vi.stubGlobal("matchMedia", () => Object.assign(new EventTarget(), { matches: false }));
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) {
      enterViewport = () => callback([{ isIntersecting: true }] as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
    }
    observe(element: Element) { observed = element; }
    disconnect() {}
  });
});
afterEach(cleanup);

describe("Works cover reveal coordination", () => {
  it("observes the unclipped wrapper and waits for image readiness before revealing", async () => {
    const { container } = render(<Card slug="reveal-ready" />);
    const entry = container.querySelector<HTMLElement>("[data-work-entry]")!;
    expect(observed).toBe(container.querySelector("[data-cover-bounds]"));
    act(() => enterViewport());
    expect(entry.dataset.workReveal).toBe("pending");
    await act(async () => { container.querySelector("img")!.dataset.imageState = "ready"; });
    expect(entry.dataset.workReveal).toBe("visible");
  });

  it("does not replay the reveal on a cover that has already appeared", async () => {
    const first = render(<Card slug="reveal-once" />);
    act(() => enterViewport());
    await act(async () => { first.container.querySelector("img")!.dataset.imageState = "ready"; });
    first.unmount();
    const second = render(<Card slug="reveal-once" />);
    expect(second.container.querySelector<HTMLElement>("[data-work-entry]")!.dataset.workReveal).toBe("seen");
  });

  it("skips the mask when a reverse transition lands on a card for the first time", () => {
    transition.returning = true;
    const { container } = render(<Card slug="direct-detail-return" />);
    expect(container.querySelector<HTMLElement>("[data-work-entry]")!.dataset.workReveal).toBe("seen");
    expect(observed).toBeUndefined();
  });
});
