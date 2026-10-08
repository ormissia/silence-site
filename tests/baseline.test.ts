import { describe, expect, it } from "vitest";
import { normalizeDateMaybe, resolveContentSlug, resolveReadingSlug } from "@/lib/content/fields";
import { shouldStartRouteProgress } from "@/lib/route-navigation";

const intent = {
  href: "https://example.test/reading?cat=history",
  currentHref: "https://example.test/reading?cat=all",
  defaultPrevented: false,
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  target: "",
  download: false,
};

describe("existing content and route contracts", () => {
  it("preserves explicit reading slugs and trims handwritten work slugs", () => {
    expect(resolveReadingSlug("book", { slug: " custom " })).toBe(" custom ");
    expect(resolveContentSlug("work", { slug: " custom " })).toBe("custom");
  });

  it("does not interpret numeric ISBN as a reading slug", () => {
    expect(resolveReadingSlug("book", { isbn: 12345 })).toBe(resolveReadingSlug("book", {}));
    expect(resolveReadingSlug("book", { bookId: 12345 })).toBe("b12345");
    expect(normalizeDateMaybe(new Date("2026-06-01T00:00:00Z"))).toBe("2026-06-01");
  });

  it("starts progress for a query change but not a hash-only change", () => {
    expect(shouldStartRouteProgress(intent)).toBe(true);
    expect(shouldStartRouteProgress({ ...intent, href: `${intent.currentHref}#notes` })).toBe(false);
  });

  it("leaves modified, cancelled and external navigation to the browser", () => {
    expect(shouldStartRouteProgress({ ...intent, metaKey: true })).toBe(false);
    expect(shouldStartRouteProgress({ ...intent, target: "_blank" })).toBe(false);
    expect(shouldStartRouteProgress({ ...intent, defaultPrevented: true })).toBe(false);
    expect(shouldStartRouteProgress({ ...intent, href: "https://elsewhere.test/reading" })).toBe(false);
  });
});
