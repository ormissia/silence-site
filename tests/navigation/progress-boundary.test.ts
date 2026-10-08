import { describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => {
  throw new Error("Navigation actions must not import the animated progress view");
});

describe("navigation dependency boundary", () => {
  it("loads link actions without loading the animation library", async () => {
    const links = await import("@/components/layout/nav-link");
    const returns = await import("@/components/layout/list-return");
    expect(links.NavProgressLink).toBeTypeOf("function");
    expect(returns.EnterListLink).toBeTypeOf("function");
  });
});
