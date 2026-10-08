// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReadingEntryPage from "@/app/reading/[slug]/page";
import { RouteProgressProvider, useRouteProgress } from "@/components/layout/route-progress";

vi.mock("@/lib/reading", () => ({
  getReadingMetadata: () => ({ slug: "first", title: "First book", category: "历史" }),
  getReadingSections: () => ({ metadataHtml: "", notesHtml: "" }),
  listReadingSummaries: () => [
    { slug: "first", title: "First book", category: "历史" },
    { slug: "second%2Fbook", title: "Second book", category: "文学" },
  ],
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
  notFound: () => { throw new Error("Unexpected missing fixture"); },
}));

vi.mock("next/link", () => ({
  default: ({ href, replace, scroll, prefetch, ...props }: ComponentProps<"a"> & {
    replace?: boolean; scroll?: boolean; prefetch?: boolean;
  }) => <a {...props} href={href} data-replace={replace} data-scroll={scroll} data-prefetch={prefetch} />,
}));

function ProgressState() {
  return <output data-testid="progress">{String(useRouteProgress().isLoading)}</output>;
}

function Wrapper({ children }: { children: ReactNode }) {
  return <RouteProgressProvider>
    <div onClick={(event) => event.preventDefault()}>{children}</div>
    <ProgressState />
  </RouteProgressProvider>;
}

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, "", "/reading/first");
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = true; }),
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = false; }),
  });
});

afterEach(cleanup);

describe("reading detail navigation", () => {
  it.each([
    { searchParams: {}, list: "/reading", next: "/reading/second%2Fbook", label: "书架" },
    { searchParams: { cat: "all" }, list: "/reading", next: "/reading/second%2Fbook", label: "书架" },
    { searchParams: { cat: ["历史", "文学"] }, list: "/reading", next: "/reading/second%2Fbook", label: "书架" },
    { searchParams: { cat: "历史 & +/%" }, list: "/reading?cat=%E5%8E%86%E5%8F%B2%20%26%20%2B%2F%25", next: "/reading/second%2Fbook?cat=%E5%8E%86%E5%8F%B2%20%26%20%2B%2F%25", label: "书架" },
    { searchParams: { view: "evolution", cat: "历史" }, list: "/reading/evolution", next: "/reading/second%2Fbook?view=evolution", label: "阅读演化" },
    { searchParams: { view: ["evolution"], cat: "历史" }, list: "/reading?cat=%E5%8E%86%E5%8F%B2", next: "/reading/second%2Fbook?cat=%E5%8E%86%E5%8F%B2", label: "书架" },
  ])("preserves detail return and next-book URLs for $searchParams", ({ searchParams, list, next, label }) => {
    render(ReadingEntryPage({ params: { slug: "first" }, searchParams }), { wrapper: Wrapper });
    const returns = screen.getAllByRole("link").filter((link) => link.getAttribute("aria-label")?.includes("返回"));
    expect(returns).toHaveLength(2);
    for (const link of returns) {
      expect(link.getAttribute("href")).toBe(list);
      expect(link.getAttribute("aria-label")).toContain(label);
      expect(link.getAttribute("data-replace")).toBe("true");
      expect(link.getAttribute("data-scroll")).toBe("false");
    }
    const nextBook = screen.getByRole("link", { name: /Next book/ });
    expect(nextBook.getAttribute("href")).toBe(next);
    fireEvent.click(nextBook);
    expect(sessionStorage.length).toBe(0);
  });

  it("starts next-book progress without replacing the original list scroll position", () => {
    const key = "silence:list-position:/reading/evolution";
    sessionStorage.setItem(key, "900");
    render(ReadingEntryPage({ params: { slug: "first" }, searchParams: { view: "evolution" } }), { wrapper: Wrapper });

    fireEvent.click(screen.getByRole("link", { name: /Next book/ }));

    expect(screen.getByTestId("progress").textContent).toBe("true");
    expect(sessionStorage.getItem(key)).toBe("900");
    expect(sessionStorage.getItem("silence:return-to-list")).toBeNull();
  });
});
