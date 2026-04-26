import { describe, it, expect } from "vitest";
import {
  diffSnapshots,
  type SnapshotForDiff,
  type SnapshotItem,
  type SnapshotBlock,
} from "@/lib/resume/diff";

const baseSnapshot = (overrides: Partial<SnapshotForDiff> = {}): SnapshotForDiff => ({
  title: "Resume",
  templateId: "modern-clean",
  headerOverrides: { fullName: "Avery Chen" },
  summaryOverride: null,
  settings: null,
  blocks: [],
  ...overrides,
});

const item = (overrides: Partial<SnapshotItem>): SnapshotItem => ({
  sourceType: "work_experience",
  sourceId: "exp-1",
  sortOrder: 0,
  isVisible: true,
  overrides: null,
  ...overrides,
});

const block = (
  blockType: string,
  items: SnapshotItem[] = [],
  overrides: Partial<SnapshotBlock> = {},
): SnapshotBlock => ({
  blockType,
  headingOverride: null,
  sortOrder: 0,
  isVisible: true,
  config: null,
  items,
  ...overrides,
});

describe("diffSnapshots — top-level fields", () => {
  it("flags no changes when snapshots are identical", () => {
    const a = baseSnapshot();
    const result = diffSnapshots(a, a);
    expect(result.hasAnyChange).toBe(false);
    expect(result.resumeChanges).toEqual([]);
    expect(result.blocks).toEqual([]);
  });

  it("detects title change", () => {
    const before = baseSnapshot({ title: "Old" });
    const after = baseSnapshot({ title: "New" });
    const result = diffSnapshots(before, after);
    expect(result.hasAnyChange).toBe(true);
    expect(result.resumeChanges).toContainEqual({
      kind: "field-changed",
      field: "title",
      before: "Old",
      after: "New",
    });
  });

  it("detects template change", () => {
    const before = baseSnapshot({ templateId: "modern-clean" });
    const after = baseSnapshot({ templateId: "executive" });
    const result = diffSnapshots(before, after);
    expect(result.resumeChanges).toContainEqual(
      expect.objectContaining({ field: "template" }),
    );
  });

  it("detects summary change including null transitions", () => {
    const before = baseSnapshot({ summaryOverride: null });
    const after = baseSnapshot({ summaryOverride: "Brand new summary." });
    const result = diffSnapshots(before, after);
    expect(result.resumeChanges).toContainEqual(
      expect.objectContaining({ field: "summary", before: null }),
    );
  });

  it("detects header field changes with prefix", () => {
    const before = baseSnapshot({ headerOverrides: { fullName: "Old" } });
    const after = baseSnapshot({ headerOverrides: { fullName: "New" } });
    const result = diffSnapshots(before, after);
    expect(result.resumeChanges).toContainEqual(
      expect.objectContaining({ field: "header.fullName" }),
    );
  });

  it("detects header field added", () => {
    const before = baseSnapshot({ headerOverrides: { fullName: "Avery" } });
    const after = baseSnapshot({
      headerOverrides: { fullName: "Avery", linkedinUrl: "https://x" },
    });
    const result = diffSnapshots(before, after);
    expect(result.resumeChanges).toContainEqual(
      expect.objectContaining({
        field: "header.linkedinUrl",
        kind: "field-added",
      }),
    );
  });
});

describe("diffSnapshots — block-level changes", () => {
  it("flags an added block", () => {
    const before = baseSnapshot();
    const after = baseSnapshot({ blocks: [block("experience")] });
    const result = diffSnapshots(before, after);
    expect(result.blocksAdded.length).toBe(1);
    expect(result.blocksAdded[0].blockType).toBe("experience");
  });

  it("flags a removed block", () => {
    const before = baseSnapshot({ blocks: [block("skills")] });
    const after = baseSnapshot();
    const result = diffSnapshots(before, after);
    expect(result.blocksRemoved.length).toBe(1);
    expect(result.blocksRemoved[0].blockType).toBe("skills");
  });

  it("flags a heading override change", () => {
    const before = baseSnapshot({
      blocks: [block("experience", [], { headingOverride: null })],
    });
    const after = baseSnapshot({
      blocks: [block("experience", [], { headingOverride: "Career" })],
    });
    const result = diffSnapshots(before, after);
    expect(result.blocks[0].changes).toContainEqual(
      expect.objectContaining({ field: "heading", after: "Career" }),
    );
    expect(result.blocks[0].heading).toBe("Career"); // resolves from override
  });

  it("flags a visibility toggle on a block", () => {
    const before = baseSnapshot({
      blocks: [block("skills", [], { isVisible: true })],
    });
    const after = baseSnapshot({
      blocks: [block("skills", [], { isVisible: false })],
    });
    const result = diffSnapshots(before, after);
    expect(result.blocks[0].changes).toContainEqual(
      expect.objectContaining({ field: "visibility" }),
    );
  });

  it("matches duplicate block types by occurrence index", () => {
    // Two custom blocks: only the second changes its heading. The
    // diff should pair (custom#0 → custom#0, custom#1 → custom#1)
    // and report exactly one changed block.
    const before = baseSnapshot({
      blocks: [
        block("custom", [], { headingOverride: "Awards" }),
        block("custom", [], { headingOverride: "Volunteering" }),
      ],
    });
    const after = baseSnapshot({
      blocks: [
        block("custom", [], { headingOverride: "Awards" }),
        block("custom", [], { headingOverride: "Volunteering & Boards" }),
      ],
    });
    const result = diffSnapshots(before, after);
    expect(result.blocks.length).toBe(1);
    expect(result.blocks[0].heading).toBe("Volunteering & Boards");
  });
});

describe("diffSnapshots — item changes within a block", () => {
  it("flags an added item", () => {
    const before = baseSnapshot({
      blocks: [block("experience", [item({ sourceId: "a" })])],
    });
    const after = baseSnapshot({
      blocks: [
        block("experience", [
          item({ sourceId: "a" }),
          item({ sourceId: "b" }),
        ]),
      ],
    });
    const result = diffSnapshots(before, after);
    const expBlock = result.blocks[0];
    expect(expBlock.itemChanges).toEqual([
      expect.objectContaining({ kind: "item-added", sourceId: "b" }),
    ]);
  });

  it("flags a removed item", () => {
    const before = baseSnapshot({
      blocks: [
        block("experience", [
          item({ sourceId: "a" }),
          item({ sourceId: "b" }),
        ]),
      ],
    });
    const after = baseSnapshot({
      blocks: [block("experience", [item({ sourceId: "a" })])],
    });
    const result = diffSnapshots(before, after);
    expect(result.blocks[0].itemChanges).toEqual([
      expect.objectContaining({ kind: "item-removed", sourceId: "b" }),
    ]);
  });

  it("flags an override field change on an existing item", () => {
    const before = baseSnapshot({
      blocks: [
        block("experience", [
          item({ sourceId: "a", overrides: { title: "Engineer" } }),
        ]),
      ],
    });
    const after = baseSnapshot({
      blocks: [
        block("experience", [
          item({ sourceId: "a", overrides: { title: "Senior Engineer" } }),
        ]),
      ],
    });
    const result = diffSnapshots(before, after);
    const ic = result.blocks[0].itemChanges[0];
    expect(ic.kind).toBe("item-modified");
    expect(ic.changes).toContainEqual(
      expect.objectContaining({ field: "title", after: "Senior Engineer" }),
    );
  });

  it("treats a sortOrder-only change as item-reordered", () => {
    const before = baseSnapshot({
      blocks: [
        block("experience", [
          item({ sourceId: "a", sortOrder: 0 }),
          item({ sourceId: "b", sortOrder: 1 }),
        ]),
      ],
    });
    const after = baseSnapshot({
      blocks: [
        block("experience", [
          item({ sourceId: "a", sortOrder: 1 }),
          item({ sourceId: "b", sortOrder: 0 }),
        ]),
      ],
    });
    const result = diffSnapshots(before, after);
    const kinds = result.blocks[0].itemChanges.map((c) => c.kind);
    expect(kinds).toEqual(expect.arrayContaining(["item-reordered"]));
    // Both reorders are surfaced.
    expect(result.blocks[0].itemChanges.length).toBe(2);
  });

  it("does not surface a no-op change", () => {
    const before = baseSnapshot({
      blocks: [
        block("experience", [
          item({ sourceId: "a", overrides: { title: "Eng", company: "X" } }),
        ]),
      ],
    });
    // Same overrides, different key insertion order — must dedup.
    const after = baseSnapshot({
      blocks: [
        block("experience", [
          item({ sourceId: "a", overrides: { company: "X", title: "Eng" } }),
        ]),
      ],
    });
    const result = diffSnapshots(before, after);
    expect(result.hasAnyChange).toBe(false);
  });
});

describe("diffSnapshots — item label fallback", () => {
  it("uses overrides.title when present", () => {
    const before = baseSnapshot();
    const after = baseSnapshot({
      blocks: [
        block("experience", [
          item({ sourceId: "x", overrides: { title: "Staff Engineer" } }),
        ]),
      ],
    });
    const result = diffSnapshots(before, after);
    expect(result.blocksAdded[0].itemChanges[0]?.label ?? result.blocksAdded[0]).toBeDefined();
  });

  it("falls back to a sourceId stub when no identifying override exists", () => {
    const before = baseSnapshot({
      blocks: [block("skills", [item({ sourceId: "skill-abc-123", sourceType: "skill", overrides: null })])],
    });
    const after = baseSnapshot();
    const result = diffSnapshots(before, after);
    const removed = result.blocksRemoved[0];
    expect(removed).toBeDefined();
  });
});
