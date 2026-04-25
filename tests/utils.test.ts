import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

// `cn` is the className helper used in every component. It composes
// `clsx` (joins truthy classes) with `tailwind-merge` (resolves
// conflicting Tailwind classes by last-wins). The behavior we care
// about: passing one of these classes through is what makes overriding
// styles work in shadcn/ui.

describe("cn", () => {
  it("joins simple class strings", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("supports the clsx object form", () => {
    expect(cn("a", { b: true, c: false })).toBe("a b");
  });

  it("resolves conflicting tailwind classes by keeping the last one", () => {
    // Both p-2 and p-4 set padding; tailwind-merge should drop p-2.
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("preserves non-conflicting tailwind classes side-by-side", () => {
    const result = cn("p-2", "m-4");
    expect(result.split(" ").sort()).toEqual(["m-4", "p-2"]);
  });

  it("returns an empty string when given nothing usable", () => {
    expect(cn()).toBe("");
    expect(cn(false, null, undefined)).toBe("");
  });
});
