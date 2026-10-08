// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ACCENT_INIT_SCRIPT, getAccentStyle } from "@/lib/accent";

function initialize(values: number[]) {
  const getRandomValues = vi.fn((target: Uint32Array) => target.set(values));
  const run = new Function("document", "crypto", ACCENT_INIT_SCRIPT);
  run(document, { getRandomValues });
  return { run, getRandomValues };
}

describe("shared accent geometry", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("style");
    document.documentElement.removeAttribute("data-theme");
  });

  it("initializes only once per document, retaining geometry across theme changes", () => {
    const { run, getRandomValues } = initialize([1000000000, 2000000000, 3000000000, 4000000000]);
    const initial = document.documentElement.style.cssText;
    document.documentElement.dataset.theme = "light";
    run(document, { getRandomValues });
    expect(document.documentElement.style.cssText).toBe(initial);
    expect(getRandomValues).toHaveBeenCalledTimes(1);
  });

  it("changes geometry on a new document without writing palette variables", () => {
    initialize([0, 0, 0, 0]);
    const initial = document.documentElement.style.cssText;
    document.documentElement.removeAttribute("style");
    initialize([4294967295, 4294967295, 4294967295, 4294967295]);
    const style = document.documentElement.style;
    expect(style.cssText).not.toBe(initial);
    expect(Array.from(style)).toEqual([
      "--accent-angle-base", "--accent-position-base", "--accent-glow-base", "--accent-shadow-base",
    ]);
  });

  it("renders identical element offsets on the server and on rerender, with distinct semantic keys", () => {
    const markup = (key: string) => renderToStaticMarkup(<span style={getAccentStyle(key)} />);
    expect(markup("site:wordmark")).toBe(markup("site:wordmark"));
    expect(markup("site:wordmark")).not.toBe(markup("about:quote"));
  });
});
