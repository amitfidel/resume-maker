import { describe, it, expect } from "vitest";
import { stableStringify } from "@/lib/json/stable";

// `stableStringify` powers the dedup check in `recordUndoCheckpoint`.
// If two structurally identical resume snapshots produce different
// strings, the undo stack fills with duplicates; if two structurally
// different snapshots produce the same string, real changes are
// silently dropped. Both classes of bug are nasty and silent — hence
// these tests.

describe("stableStringify", () => {
  it("matches JSON.stringify for primitives", () => {
    expect(stableStringify(null)).toBe("null");
    expect(stableStringify(true)).toBe("true");
    expect(stableStringify(false)).toBe("false");
    expect(stableStringify(42)).toBe("42");
    expect(stableStringify(3.14)).toBe("3.14");
    expect(stableStringify("hi")).toBe('"hi"');
    expect(stableStringify("")).toBe('""');
  });

  it("escapes special characters in strings the same way as JSON.stringify", () => {
    expect(stableStringify('a"b')).toBe('"a\\"b"');
    expect(stableStringify("a\nb")).toBe('"a\\nb"');
  });

  it("produces identical output regardless of key insertion order", () => {
    const a = { x: 1, y: 2, z: 3 };
    const b: Record<string, number> = {};
    b.z = 3;
    b.y = 2;
    b.x = 1;
    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  it("sorts deeply nested keys", () => {
    const a = { outer: { b: 1, a: 2 } };
    const b = { outer: { a: 2, b: 1 } };
    expect(stableStringify(a)).toBe(stableStringify(b));
    expect(stableStringify(a)).toBe('{"outer":{"a":2,"b":1}}');
  });

  it("preserves array order (positional, not associative)", () => {
    expect(stableStringify([3, 1, 2])).toBe("[3,1,2]");
    // Different array order => different string.
    expect(stableStringify([1, 2, 3])).not.toBe(stableStringify([3, 2, 1]));
  });

  it("handles arrays of objects with shuffled keys", () => {
    const a = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
    const b = [{ y: 2, x: 1 }, { y: 4, x: 3 }];
    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  it("treats structurally different objects as different", () => {
    expect(stableStringify({ a: 1 })).not.toBe(stableStringify({ a: 2 }));
    expect(stableStringify({ a: 1 })).not.toBe(stableStringify({ a: 1, b: 2 }));
  });

  it("matches a real-world resume-snapshot shape", () => {
    // Same content, different key order — must dedup.
    const snapA = {
      title: "Resume",
      blocks: [
        {
          blockType: "experience",
          isVisible: true,
          sortOrder: 0,
          items: [{ sourceType: "work_experience", overrides: { title: "Eng" } }],
        },
      ],
    };
    const snapB = {
      blocks: [
        {
          items: [{ overrides: { title: "Eng" }, sourceType: "work_experience" }],
          sortOrder: 0,
          isVisible: true,
          blockType: "experience",
        },
      ],
      title: "Resume",
    };
    expect(stableStringify(snapA)).toBe(stableStringify(snapB));
  });
});
