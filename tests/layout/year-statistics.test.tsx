// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { YearStatisticsDisclosure } from "@/components/reading/year-statistics";

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true, value: function (this: HTMLDialogElement) { this.open = true; this.querySelector("button")?.focus(); },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true, value: function (this: HTMLDialogElement) { this.open = false; },
  });
});
afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});

it.each(["button", "escape"])("returns focus and releases scroll after closing statistics via %s", (method) => {
  document.body.style.overflow = "auto";
  const view = render(<YearStatisticsDisclosure year="2026" books={[]} categories={[]} />);
  const trigger = view.getByRole("button", { name: /查看年度统计/ });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = view.getByRole("dialog");
  expect(document.body.style.overflow).toBe("hidden");
  expect(document.activeElement).toBe(view.getByRole("button", { name: "关闭" }));
  if (method === "button") fireEvent.click(view.getByRole("button", { name: "关闭" }));
  else fireEvent(dialog, new Event("cancel", { cancelable: true }));
  expect(view.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(trigger);
  expect(document.body.style.overflow).toBe("auto");
});

it("releases the body scroll lock when navigating away from an open statistics dialog", () => {
  const view = render(<YearStatisticsDisclosure year="2026" books={[]} categories={[]} />);
  fireEvent.click(view.getByRole("button", { name: /查看年度统计/ }));
  view.unmount();
  expect(document.body.style.overflow).toBe("");
});
