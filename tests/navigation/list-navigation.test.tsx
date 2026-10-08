// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReadingShelf } from "@/components/reading/reading-shelf";
import { BookCard } from "@/components/reading/book-card";
import { BookDialog } from "@/components/reading/book-dialog";
import { BookToolbar } from "@/components/reading/book-toolbar";
import { WorksGallery } from "@/components/work/works-gallery";
import { JournalList } from "@/components/journal/journal-list";
import { ReadingEvolution } from "@/components/reading/reading-evolution";
import { CategoryTabs } from "@/components/layout/category-tabs";
import { RouteProgressProvider, useRouteProgress } from "@/components/layout/route-progress";
import { EnterListLink, RestoreListScroll, ReturnToListLink, useEnterListClick } from "@/components/layout/list-return";
import { NavProgressLink } from "@/components/layout/nav-link";
import type { ReadingSummary } from "@/lib/reading/types";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn(), suspendSearch: false }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => window.location.pathname,
  useSearchParams: () => {
    if (router.suspendSearch) throw new Promise(() => {});
    return new URLSearchParams(window.location.search);
  },
}));

// Keep a real anchor and its events; Next's routing is the only boundary replaced.
vi.mock("next/link", () => ({
  default: ({ href, replace, scroll, prefetch, ...props }: ComponentProps<"a"> & {
    replace?: boolean; scroll?: boolean; prefetch?: boolean;
  }) => <a {...props} href={href} data-replace={replace} data-scroll={scroll} data-prefetch={prefetch} />,
}));

const book: ReadingSummary = {
  slug: "book-42",
  title: "测试读书笔记",
  category: "历史",
  finishedDate: "2025-10-01",
};
const shelfHref = "/reading?cat=%E5%8E%86%E5%8F%B2";
const positionKey = (href: string) => `silence:list-position:${href}`;
const returnKey = "silence:return-to-list";
const shelfProps = { books: [book], categories: [{ name: book.category, count: 1 }] };

function navigate(href: string) {
  window.history.replaceState(null, "", href);
}

function ProgressState() {
  const progress = useRouteProgress();
  return <output data-testid="progress">{String(progress.isLoading)}</output>;
}

function NavigationHarness({ children, afterClick }: {
  children: ReactNode;
  afterClick?: (event: MouseEvent<HTMLDivElement>) => void;
}) {
  return <RouteProgressProvider>
    <div onClick={(event) => {
      afterClick?.(event);
      // Cancel only AFTER the link's handler, to avoid jsdom's unsupported navigation.
      event.preventDefault();
    }}>{children}</div>
    <ProgressState />
  </RouteProgressProvider>;
}

function SvgEntry() {
  const onClick = useEnterListClick(shelfHref);
  return <svg><a href="/reading/book-42" onClick={onClick} aria-label="SVG book"><circle r="5" /></a></svg>;
}

beforeEach(() => {
  router.suspendSearch = false;
  sessionStorage.clear();
  navigate(shelfHref);
  vi.spyOn(window, "scrollY", "get").mockReturnValue(735);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {},
  })));
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = true; }),
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = false; }),
  });
});

afterEach(cleanup);

describe("the real reading shelf entry/return path", () => {
  it("only closes a dialog on an outside click and restores its previous body overflow", () => {
    navigate("/reading/book-42");
    document.body.style.overflow = "auto";
    const detail = render(<BookDialog returnHref={shelfHref} titleId="test-book"><h1 id="test-book">Book</h1></BookDialog>, { wrapper: NavigationHarness });
    const dialog = screen.getByRole("dialog");
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ left: 10, right: 200, top: 10, bottom: 200 } as DOMRect);
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.click(dialog, { clientX: 100, clientY: 100 });
    expect(sessionStorage.length).toBe(0);
    fireEvent.click(dialog, { clientX: 0, clientY: 0 });
    expect(sessionStorage.getItem(returnKey)).toBe(shelfHref);
    expect(router.replace).toHaveBeenCalledExactlyOnceWith(shelfHref, { scroll: false });
    detail.unmount();
    expect(document.body.style.overflow).toBe("auto");
    document.body.style.overflow = "";
  });

  it("requests the latest list destination when the book dialog is cancelled", () => {
    navigate("/reading/book-42");
    const detail = render(<BookDialog returnHref="/reading" titleId="test-book"><h1 id="test-book">Book</h1></BookDialog>, { wrapper: NavigationHarness });
    detail.rerender(<BookDialog returnHref={shelfHref} titleId="test-book"><h1 id="test-book">Book</h1></BookDialog>);
    const dialog = screen.getByRole("dialog");

    fireEvent(dialog, new Event("cancel", { cancelable: true }));

    expect(sessionStorage.getItem(returnKey)).toBe(shelfHref);
    expect(router.replace).toHaveBeenCalledExactlyOnceWith(shelfHref, { scroll: false });
    expect(screen.getByTestId("progress").textContent).toBe("true");
  });

  it.each(["返回书架", "关闭书籍详情，返回书架"])("leaves modified toolbar action %s untouched", (name) => {
    navigate("/reading/book-42");
    render(<BookToolbar title={book.title} titleId="book-detail-title" returnHref={shelfHref} />, { wrapper: NavigationHarness });
    fireEvent.click(screen.getByRole("link", { name }), { metaKey: true });
    expect(sessionStorage.length).toBe(0);
    expect(screen.getByTestId("progress").textContent).toBe("false");
  });

  it.each([
    { search: "", query: "" },
    { search: "?cat=all", query: "" },
    { search: "?cat=", query: "" },
    { search: "?cat=%E5%8E%86%E5%8F%B2", query: "?cat=%E5%8E%86%E5%8F%B2" },
    { search: "?cat=space+%26+plus%2B%2F%25", query: "?cat=space%20%26%20plus%2B%2F%25" },
  ])("preserves existing reading card URLs for $search", ({ search, query }) => {
    navigate(`/reading${search}`);
    render(<BookCard book={{ ...book, slug: "literal%2Fslug" }} index={0} />, { wrapper: NavigationHarness });
    const entry = screen.getByRole("link");
    expect(entry.getAttribute("href")).toBe(`/reading/literal%2Fslug${query}`);
    fireEvent.click(entry);
    expect(sessionStorage.getItem(positionKey(`/reading${query}`))).toBe("735");
  });

  it("keeps the touch flip button out of the entry navigation protocol", () => {
    render(<ReadingShelf {...shelfProps} />, { wrapper: NavigationHarness });
    fireEvent.click(screen.getByRole("button", { name: "查看书籍信息：测试读书笔记" }));
    expect(screen.getByRole("button", { name: "显示封面：测试读书笔记" }).getAttribute("aria-pressed")).toBe("true");
    expect(sessionStorage.length).toBe(0);
    expect(screen.getByTestId("progress").textContent).toBe("false");
  });

  it("shares progress feedback with both toolbar return links", () => {
    navigate("/reading/book-42");
    render(<BookToolbar title={book.title} titleId="book-detail-title" returnHref={shelfHref} />, { wrapper: NavigationHarness });

    fireEvent.click(screen.getByRole("link", { name: "关闭书籍详情，返回书架" }));

    expect(sessionStorage.getItem(returnKey)).toBe(shelfHref);
    expect(screen.getByTestId("progress").textContent).toBe("true");
  });

  it("leaves modified book clicks to the browser without overwriting the saved shelf position", () => {
    render(<ReadingShelf {...shelfProps} />, { wrapper: NavigationHarness });
    const entry = screen.getByRole("link", { name: "查看《测试读书笔记》的读书笔记" });
    sessionStorage.setItem(positionKey(shelfHref), "200");

    fireEvent.click(entry, { metaKey: true });

    expect(sessionStorage.getItem(positionKey(shelfHref))).toBe("200");
    expect(screen.getByTestId("progress").textContent).toBe("false");
  });

  it("restores the filtered shelf after opening a book and returning from its toolbar", () => {
    const shelf = render(<ReadingShelf {...shelfProps} />, { wrapper: NavigationHarness });
    const entry = screen.getByRole("link", { name: "查看《测试读书笔记》的读书笔记" });
    expect(entry.getAttribute("href")).toBe(`/reading/book-42?cat=%E5%8E%86%E5%8F%B2`);
    fireEvent.click(entry);
    expect(sessionStorage.getItem(positionKey(shelfHref))).toBe("735");

    shelf.unmount();
    navigate(entry.getAttribute("href")!);
    const detail = render(<BookToolbar title={book.title} titleId="book-detail-title" returnHref={shelfHref} />, { wrapper: NavigationHarness });
    const back = screen.getByRole("link", { name: "返回书架" });
    expect(back.getAttribute("data-replace")).toBe("true");
    expect(back.getAttribute("data-scroll")).toBe("false");
    fireEvent.click(back);
    expect(sessionStorage.getItem(returnKey)).toBe(shelfHref);

    detail.unmount();
    navigate(shelfHref);
    render(<ReadingShelf {...shelfProps} />, { wrapper: NavigationHarness });
    expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith(0, 735);
    expect(sessionStorage.getItem(returnKey)).toBeNull();
  });
});

describe("existing list entry points", () => {
  it("keeps static evolution content visible while its route query hook suspends", () => {
    navigate("/reading/evolution");
    router.suspendSearch = true;

    render(<ReadingEvolution books={[]} />);

    expect(screen.queryByText("记录读完日期后，阅读轨迹会出现在这里。")).not.toBeNull();
  });

  it("restores the works list once on return", () => {
    navigate("/works?tab=portrait");
    sessionStorage.setItem(returnKey, "/works?tab=portrait");
    sessionStorage.setItem(positionKey("/works?tab=portrait"), "412");
    render(<WorksGallery works={[]} categoryCounts={[]} />);
    expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith(0, 412);
    expect(sessionStorage.getItem(returnKey)).toBeNull();
  });

  it("restores the journal list once on return", () => {
    navigate("/journal?cat=tech");
    sessionStorage.setItem(returnKey, "/journal?cat=tech");
    sessionStorage.setItem(positionKey("/journal?cat=tech"), "621");
    render(<JournalList entries={[]} />);
    expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith(0, 621);
    expect(sessionStorage.getItem(returnKey)).toBeNull();
  });

  it("restores the evolution list once on return", () => {
    navigate("/reading/evolution");
    sessionStorage.setItem(returnKey, "/reading/evolution");
    sessionStorage.setItem(positionKey("/reading/evolution"), "931");
    render(<ReadingEvolution books={[]} />);
    expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith(0, 931);
    expect(sessionStorage.getItem(returnKey)).toBeNull();
  });

  it("reads the native target of SVG evolution anchors", () => {
    navigate("/reading/evolution");
    const { container } = render(<ReadingEvolution books={[book]} />, { wrapper: NavigationHarness });
    const entry = container.querySelector("svg a")!;
    entry.setAttribute("target", "_blank");

    fireEvent.click(entry);

    expect(sessionStorage.length).toBe(0);
    expect(screen.getByTestId("progress").textContent).toBe("false");
  });

  it("keeps all evolution entry links modifier-safe", () => {
    navigate("/reading/evolution");
    const { container } = render(<ReadingEvolution books={[book, { ...book, slug: "undated", finishedDate: undefined }]} />, { wrapper: NavigationHarness });
    const entries = Array.from(container.querySelectorAll("a"));
    // Desktop SVG, mobile timeline and undated fallback remain real links.
    expect(entries).toHaveLength(3);
    for (const entry of entries) {
      expect(entry.getAttribute("href")).toMatch(/^\/reading\/(book-42|undated)\?view=evolution$/);
      expect(entry.getAttribute("data-prefetch")).toBe("false");
      expect(entry.getAttribute("data-scroll")).toBe("false");
      sessionStorage.clear();

      fireEvent.click(entry, { altKey: true });

      expect(sessionStorage.getItem(positionKey("/reading/evolution"))).toBeNull();
      fireEvent.click(entry);
      expect(sessionStorage.getItem(positionKey("/reading/evolution"))).toBe("735");
      expect(screen.getByTestId("progress").textContent).toBe("true");
    }
  });

  it("only saves a journal filter for an ordinary entry click", () => {
    const listHref = "/journal?cat=tech";
    navigate(listHref);
    render(<JournalList entries={[{
      slug: "note-42", title: "Journal note", category: "tech", date: "2025-10-01",
    }]} />, { wrapper: NavigationHarness });
    const entry = screen.getByRole("link");
    expect(entry.getAttribute("href")).toBe("/journal/note-42?cat=tech");

    fireEvent.click(entry, { shiftKey: true });
    expect(sessionStorage.getItem(positionKey(listHref))).toBeNull();
    fireEvent.click(entry);
    expect(sessionStorage.getItem(positionKey(listHref))).toBe("735");
    expect(screen.getByTestId("progress").textContent).toBe("true");
  });

  it("only saves a works filter for an ordinary card click", () => {
    const listHref = "/works?tab=portrait";
    navigate(listHref);
    render(<WorksGallery works={[{
      slug: "portrait-42", title: "Portrait", series: "人像", date: "2025-10-01",
      location: "—", cover: "/images/portrait.jpg", deck: "A portrait",
    }]} categoryCounts={[{ series: "人像", count: 1 }]} />, { wrapper: NavigationHarness });
    const entry = screen.getByRole("link");
    expect(entry.getAttribute("href")).toBe("/works/portrait-42?tab=portrait");

    fireEvent.click(entry, { ctrlKey: true });
    expect(sessionStorage.getItem(positionKey(listHref))).toBeNull();
    fireEvent.click(entry);
    expect(sessionStorage.getItem(positionKey(listHref))).toBe("735");
    expect(screen.getByTestId("progress").textContent).toBe("true");
  });
});

describe("classification URL compatibility", () => {
  it.each([
    { basePath: "/works", paramName: "tab", slug: "portrait", href: "/works?tab=portrait" },
    { basePath: "/journal", paramName: "cat", slug: "tech", href: "/journal?cat=tech" },
    { basePath: "/reading", paramName: "cat", slug: "历史 & +/%", href: "/reading?cat=%E5%8E%86%E5%8F%B2%20%26%20%2B%2F%25" },
  ])("uses replace without scroll for $basePath filters", ({ basePath, paramName, slug, href }) => {
    navigate(basePath);
    render(<CategoryTabs basePath={basePath} paramName={paramName} tabs={[
      { slug: "all", label: "All" }, { slug, label: "Category" },
    ]} />);
    fireEvent.click(screen.getByRole("button", { name: "Category" }));
    expect(router.replace).toHaveBeenLastCalledWith(href, { scroll: false });
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(router.replace).toHaveBeenLastCalledWith(basePath, { scroll: false });
    expect(router.push).not.toHaveBeenCalled();
    expect(sessionStorage.length).toBe(0);
  });
});

describe("route-scoped return requests", () => {
  it.each([null, "garbage", "NaN", "Infinity", "", "   "])("consumes an unusable saved position %j without scrolling", (saved) => {
    sessionStorage.setItem(returnKey, shelfHref);
    if (saved !== null) sessionStorage.setItem(positionKey(shelfHref), saved);
    render(<RestoreListScroll />);
    expect(sessionStorage.getItem(returnKey)).toBeNull();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("restores zero once even when effects are replayed in StrictMode", () => {
    sessionStorage.setItem(returnKey, shelfHref);
    sessionStorage.setItem(positionKey(shelfHref), "0");
    render(<StrictMode><RestoreListScroll /></StrictMode>);
    expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith(0, 0);
    expect(sessionStorage.getItem(returnKey)).toBeNull();
  });

  it("does not infer a return from a saved position alone", () => {
    sessionStorage.setItem(positionKey(shelfHref), "735");
    render(<RestoreListScroll />);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("tolerates storage being unavailable while mounting a list", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("blocked", "SecurityError"); });
    expect(() => render(<ReadingShelf {...shelfProps} />)).not.toThrow();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("discards a stale request when a different list is reached", () => {
    sessionStorage.setItem(positionKey(shelfHref), "735");
    sessionStorage.setItem(returnKey, shelfHref);
    navigate("/journal?cat=tech");

    const list = render(<RestoreListScroll />);

    expect(sessionStorage.getItem(returnKey)).toBeNull();
    expect(window.scrollTo).not.toHaveBeenCalled();
    navigate(shelfHref);
    list.rerender(<RestoreListScroll />);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("consumes a matching request when the mounted shelf changes category href", () => {
    navigate("/reading");
    const shelf = render(<ReadingShelf {...shelfProps} />, { wrapper: NavigationHarness });
    sessionStorage.setItem(positionKey(shelfHref), "735");
    sessionStorage.setItem(returnKey, shelfHref);

    navigate(shelfHref);
    shelf.rerender(<ReadingShelf {...shelfProps} />);

    expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith(0, 735);
    expect(sessionStorage.getItem(returnKey)).toBeNull();
    shelf.rerender(<ReadingShelf {...shelfProps} />);
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });
});

describe("composable list links", () => {
  it("uses the resolved HTML anchor destination rather than ignoring document base URLs", () => {
    const base = document.createElement("base");
    base.href = "https://elsewhere.test/";
    document.head.appendChild(base);
    try {
      render(<EnterListLink href="/reading/book-42" listHref={shelfHref}>Navigate</EnterListLink>, { wrapper: NavigationHarness });
      const entry = screen.getByRole("link", { name: "Navigate" });
      expect((entry as HTMLAnchorElement).href).toBe("https://elsewhere.test/reading/book-42");

      fireEvent.click(entry);

      expect(sessionStorage.length).toBe(0);
      expect(screen.getByTestId("progress").textContent).toBe("false");
    } finally {
      base.remove();
    }
  });

  it("starts progress for same-path query navigation even with aria-current", () => {
    render(<NavProgressLink href="/reading?cat=all" aria-current="page">All books</NavProgressLink>, { wrapper: NavigationHarness });
    fireEvent.click(screen.getByRole("link", { name: "All books" }));
    expect(screen.getByTestId("progress").textContent).toBe("true");
    expect(sessionStorage.length).toBe(0);
  });

  it("uses updated return href props when requesting restoration", () => {
    navigate("/reading/book-42");
    const detail = render(<ReturnToListLink href="/reading">Back</ReturnToListLink>, { wrapper: NavigationHarness });
    detail.rerender(<ReturnToListLink href={shelfHref}>Back</ReturnToListLink>);
    fireEvent.click(screen.getByRole("link", { name: "Back" }));
    expect(sessionStorage.getItem(returnKey)).toBe(shelfHref);
    expect(screen.getByRole("link", { name: "Back" }).getAttribute("href")).toBe(shelfHref);
  });

  it.each(["entry", "return"])("keeps the %s link usable when storage writes are denied", (kind) => {
    const afterClick = vi.fn((event: MouseEvent<HTMLDivElement>) => expect(event.defaultPrevented).toBe(false));
    render(<NavigationHarness afterClick={afterClick}>{kind === "entry"
      ? <EnterListLink href="/reading/book-42" listHref={shelfHref}>Navigate</EnterListLink>
      : <ReturnToListLink href="/reading/book-42">Navigate</ReturnToListLink>}
    </NavigationHarness>);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("blocked", "SecurityError"); });

    fireEvent.click(screen.getByRole("link", { name: "Navigate" }));

    expect(afterClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("progress").textContent).toBe("true");
  });

  const nativeClicks = [
    { name: "meta", event: { metaKey: true } },
    { name: "ctrl", event: { ctrlKey: true } },
    { name: "shift", event: { shiftKey: true } },
    { name: "alt", event: { altKey: true } },
    { name: "middle button", event: { button: 1 } },
    { name: "right button", event: { button: 2 } },
    { name: "new window", props: { target: "_blank" } },
    { name: "named frame", props: { target: "reader" } },
    { name: "download", props: { download: "notes.txt" } },
    { name: "empty download", props: { download: "" } },
    { name: "external URL", props: { href: "https://elsewhere.test/reading" } },
    { name: "mail link", props: { href: "mailto:reader@example.test" } },
    { name: "same route", props: { href: shelfHref } },
    { name: "hash-only", props: { href: `${shelfHref}#notes` } },
  ];

  describe.each(["entry", "return"] as const)("%s link", (kind) => {
    it.each(nativeClicks)("preserves $name clicks without storage or progress", ({ event, props }) => {
      const linkProps = { href: "/reading/book-42", children: "Navigate", ...props };
      render(kind === "entry"
        ? <EnterListLink {...linkProps} listHref={shelfHref} />
        : <ReturnToListLink {...linkProps} />, { wrapper: NavigationHarness });
      const writes = vi.spyOn(Storage.prototype, "setItem");
      const clears = vi.spyOn(Storage.prototype, "removeItem");

      fireEvent.click(screen.getByRole("link", { name: "Navigate" }), event);

      expect(writes).not.toHaveBeenCalled();
      expect(clears).not.toHaveBeenCalled();
      expect(screen.getByTestId("progress").textContent).toBe("false");
    });

    it("runs the caller first and respects cancellation", () => {
      const onClick = vi.fn((event: MouseEvent<HTMLAnchorElement>) => {
        expect(sessionStorage.length).toBe(0);
        event.preventDefault();
      });
      const linkProps = { href: "/reading/book-42", children: "Navigate", onClick };
      render(kind === "entry"
        ? <EnterListLink {...linkProps} listHref={shelfHref} />
        : <ReturnToListLink {...linkProps} />, { wrapper: NavigationHarness });

      fireEvent.click(screen.getByRole("link", { name: "Navigate" }));

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(sessionStorage.length).toBe(0);
      expect(screen.getByTestId("progress").textContent).toBe("false");
    });

    it("respects capture cancellation before the anchor handler", () => {
      const linkProps = { href: "/reading/book-42", children: "Navigate" };
      render(<div onClickCapture={(event) => event.preventDefault()}>{kind === "entry"
        ? <EnterListLink {...linkProps} listHref={shelfHref} />
        : <ReturnToListLink {...linkProps} />}</div>, { wrapper: NavigationHarness });

      fireEvent.click(screen.getByRole("link", { name: "Navigate" }));

      expect(sessionStorage.length).toBe(0);
      expect(screen.getByTestId("progress").textContent).toBe("false");
    });
  });

  it.each(nativeClicks)("preserves SVG $name clicks through the callback adapter", ({ event, props }) => {
    const { container } = render(<SvgEntry />, { wrapper: NavigationHarness });
    const entry = container.querySelector("svg a")!;
    for (const [name, value] of Object.entries(props ?? {})) entry.setAttribute(name, value);

    fireEvent.click(entry, event);

    expect(sessionStorage.length).toBe(0);
    expect(screen.getByTestId("progress").textContent).toBe("false");
  });

  it("saves SVG keyboard activation without cancelling or changing its href", () => {
    const afterClick = vi.fn((event: MouseEvent<HTMLDivElement>) => expect(event.defaultPrevented).toBe(false));
    const { container } = render(<NavigationHarness afterClick={afterClick}><SvgEntry /></NavigationHarness>);
    const entry = container.querySelector("svg a")!;

    fireEvent.click(entry, { detail: 0 });

    expect(entry.getAttribute("href")).toBe("/reading/book-42");
    expect(sessionStorage.getItem(positionKey(shelfHref))).toBe("735");
    expect(afterClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("progress").textContent).toBe("true");
  });

  it("preserves anchor/Next props and saves before an uncancelled keyboard-style click", () => {
    const onClick = vi.fn(() => expect(sessionStorage.length).toBe(0));
    const afterClick = vi.fn((event: MouseEvent<HTMLDivElement>) => {
      expect(event.defaultPrevented).toBe(false);
      expect(sessionStorage.getItem(positionKey(shelfHref))).toBe("735");
    });
    render(<NavigationHarness afterClick={afterClick}>
      <EnterListLink href="/reading/book-42" listHref={shelfHref} onClick={onClick}
        replace scroll={false} prefetch={false} target="_self" className="original-card"
        aria-label="Book notes" aria-current="page" title="Notes" tabIndex={2}>Book</EnterListLink>
    </NavigationHarness>);
    const link = screen.getByRole("link", { name: "Book notes" });
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("class")).toBe("original-card");
    expect(link.getAttribute("title")).toBe("Notes");
    expect(link.getAttribute("tabindex")).toBe("2");
    expect(link.getAttribute("data-replace")).toBe("true");
    expect(link.getAttribute("data-scroll")).toBe("false");
    expect(link.getAttribute("data-prefetch")).toBe("false");

    fireEvent.click(link, { detail: 0 });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(afterClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("progress").textContent).toBe("true");
  });

  it("does not arm a return request for a new-window return link", () => {
    navigate("/reading/book-42");
    render(<ReturnToListLink href={shelfHref} target="_blank">Back</ReturnToListLink>, { wrapper: NavigationHarness });

    fireEvent.click(screen.getByRole("link", { name: "Back" }));

    expect(sessionStorage.getItem(returnKey)).toBeNull();
    expect(screen.getByTestId("progress").textContent).toBe("false");
  });
});
