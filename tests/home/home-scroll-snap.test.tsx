// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeScrollSnap } from "@/components/home/home-scroll-snap";
import { RestoreListScroll } from "@/components/layout/list-return";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

let eligible = true;
let onMediaChange: () => void;
const active = () => document.documentElement.dataset.homeSnap;
const wheel = () => fireEvent.wheel(document.body, { deltaY: 120 });

beforeEach(() => {
  eligible = true;
  sessionStorage.clear();
  window.history.replaceState(null, "", "/");
  document.body.style.overflow = "";
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return eligible; },
    addEventListener: (_type: string, callback: () => void) => { onMediaChange = callback; },
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  document.body.style.overflow = "";
});

describe("homepage scroll intent", () => {
  it("leaves an exact restored position alone until a new vertical scroll gesture", () => {
    sessionStorage.setItem("silence:return-to-list", "/");
    sessionStorage.setItem("silence:list-position:/", "3663");
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(<><HomeScrollSnap /><RestoreListScroll /></>);

    expect(scroll).toHaveBeenCalledExactlyOnceWith(0, 3663);
    fireEvent.scroll(window);
    expect(active()).toBeUndefined();
    wheel();
    expect(active()).toBe("active");
  });

  it("ignores horizontal gestures, zoom, and cancelled wheel events", () => {
    render(<HomeScrollSnap />);
    fireEvent.wheel(document.body, { deltaX: 150, deltaY: 10 });
    fireEvent.wheel(document.body, { deltaY: 120, ctrlKey: true });
    const cancelled = new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true });
    cancelled.preventDefault();
    fireEvent(document.body, cancelled);
    expect(active()).toBeUndefined();
  });

  it("does not enable while the splash or a dialog locks scrolling", () => {
    const { rerender } = render(<><HomeScrollSnap /><div className="home-splash" /></>);
    wheel();
    expect(active()).toBeUndefined();
    rerender(<><HomeScrollSnap /><dialog open /></>);
    wheel();
    expect(active()).toBeUndefined();
    rerender(<HomeScrollSnap />);
    document.body.style.overflowY = "hidden";
    wheel();
    expect(active()).toBeUndefined();
    document.body.style.overflowY = "";
    wheel();
    expect(active()).toBe("active");
  });

  it("releases snap for focus, navigation, browser history, and viewport changes", () => {
    const { getByRole, unmount } = render(<><HomeScrollSnap /><a href="#page-top">Top</a></>);
    for (const release of [
      () => fireEvent.focusIn(getByRole("link")),
      () => fireEvent.click(getByRole("link")),
      () => fireEvent.pointerDown(document.body),
      () => fireEvent.popState(window),
      () => fireEvent.resize(window),
      () => fireEvent(window, new Event("pagehide")),
    ]) {
      wheel();
      expect(active()).toBe("active");
      release();
      expect(active()).toBeUndefined();
    }
    wheel();
    unmount();
    expect(active()).toBeUndefined();
    wheel();
    expect(active()).toBeUndefined();
  });

  it("allows page scrolling keys but keeps focus navigation and control keys unsnapped", () => {
    const { getByRole } = render(<><HomeScrollSnap /><button>Next</button><input aria-label="Search" /></>);
    fireEvent.keyDown(document.body, { key: "PageDown" });
    expect(active()).toBe("active");
    fireEvent.keyDown(document.body, { key: "Tab" });
    expect(active()).toBeUndefined();
    fireEvent.keyDown(getByRole("button"), { key: " " });
    fireEvent.keyDown(getByRole("textbox"), { key: "ArrowDown" });
    fireEvent.keyDown(document.body, { key: "ArrowDown", metaKey: true });
    expect(active()).toBeUndefined();
    fireEvent.keyDown(document.body, { key: "PageUp" });
    expect(active()).toBe("active");
    fireEvent.keyDown(document.body, { key: "Home" });
    expect(active()).toBeUndefined();
  });

  it("stays off on small screens and after changing motion preferences until another gesture", () => {
    render(<HomeScrollSnap />);
    wheel();
    eligible = false;
    onMediaChange();
    expect(active()).toBeUndefined();
    wheel();
    expect(active()).toBeUndefined();
    eligible = true;
    onMediaChange();
    expect(active()).toBeUndefined();
    wheel();
    expect(active()).toBe("active");
  });
});
