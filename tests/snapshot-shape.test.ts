import { describe, it, expect } from "vitest";
import { stableStringify } from "@/lib/json/stable";

/**
 * Schema-drift smoke test. The full `buildSnapshot ↔ applySnapshot`
 * round-trip is DB-coupled (see HANDOFF.md "Production-readiness
 * backlog"), but we can still cheaply verify that a `ResumeSnapshot`-
 * shaped object survives a JSONB-style serialization round-trip
 * unchanged. If a future schema change adds a Date field, a Map, a
 * Set, or some other JSON-incompatible value, this test fires before
 * the change ships and silently corrupts saved snapshots.
 *
 * The shape mirrors the `ResumeSnapshot` type in
 * `src/app/(dashboard)/resumes/actions.ts`. Update both together when
 * the snapshot contract changes.
 */

type ResumeSnapshot = {
  title: string;
  templateId: string;
  headerOverrides: Record<string, string> | null;
  summaryOverride: string | null;
  settings: Record<string, unknown> | null;
  blocks: Array<{
    blockType: string;
    headingOverride: string | null;
    sortOrder: number;
    isVisible: boolean;
    config: Record<string, unknown> | null;
    items: Array<{
      sourceType: string;
      sourceId: string;
      sortOrder: number;
      isVisible: boolean;
      overrides: Record<string, unknown> | null;
    }>;
  }>;
};

const fixture: ResumeSnapshot = {
  title: "Senior Engineer @ Acme",
  templateId: "modern-clean",
  headerOverrides: {
    fullName: "Avery Chen",
    headline: "Distributed systems",
    email: "avery@example.com",
  },
  summaryOverride: "Experienced engineer with a focus on…",
  settings: { densityMode: "comfortable", showLinks: true },
  blocks: [
    {
      blockType: "experience",
      headingOverride: null,
      sortOrder: 0,
      isVisible: true,
      config: null,
      items: [
        {
          sourceType: "work_experience",
          sourceId: "11111111-1111-1111-1111-111111111111",
          sortOrder: 0,
          isVisible: true,
          overrides: {
            title: "Staff Engineer",
            // Nested override — the bullets sub-object is the most
            // common place future schema changes will land.
            bullets: {
              "bullet-id-1": { text: "Shipped X.", visible: true },
              "bullet-id-2": { visible: false },
            },
          },
        },
      ],
    },
    {
      blockType: "skills",
      headingOverride: "Tech",
      sortOrder: 1,
      isVisible: true,
      config: { columns: 2 },
      items: [],
    },
    {
      blockType: "custom",
      headingOverride: "Awards",
      sortOrder: 2,
      isVisible: false,
      config: null,
      items: [
        {
          sourceType: "custom",
          sourceId: "22222222-2222-2222-2222-222222222222",
          sortOrder: 0,
          isVisible: true,
          overrides: { title: "Hackathon", text: "1st place" },
        },
      ],
    },
  ],
};

describe("snapshot shape — JSONB round-trip", () => {
  it("survives JSON.stringify -> JSON.parse without structural change", () => {
    const wire = JSON.stringify(fixture);
    const parsed = JSON.parse(wire) as ResumeSnapshot;
    expect(stableStringify(parsed)).toBe(stableStringify(fixture));
  });

  it("preserves null values that distinguish 'not overridden' from 'cleared'", () => {
    // headerOverrides=null and summaryOverride=null are semantically
    // different from absent: they tell `applySnapshot` to clear those
    // fields. Make sure the round-trip preserves the literal null.
    const cleared: ResumeSnapshot = {
      ...fixture,
      headerOverrides: null,
      summaryOverride: null,
      settings: null,
    };
    const parsed = JSON.parse(JSON.stringify(cleared)) as ResumeSnapshot;
    expect(parsed.headerOverrides).toBeNull();
    expect(parsed.summaryOverride).toBeNull();
    expect(parsed.settings).toBeNull();
  });

  it("preserves boolean false (not 0, not undefined)", () => {
    const parsed = JSON.parse(JSON.stringify(fixture)) as ResumeSnapshot;
    expect(parsed.blocks[2].isVisible).toBe(false);
    const overrides = parsed.blocks[0].items[0].overrides as {
      bullets: Record<string, { visible?: boolean }>;
    };
    expect(overrides.bullets["bullet-id-2"].visible).toBe(false);
  });

  it("preserves order of blocks (sort_order is a property, but order matters too for hot-path reads)", () => {
    const parsed = JSON.parse(JSON.stringify(fixture)) as ResumeSnapshot;
    expect(parsed.blocks.map((b) => b.blockType)).toEqual([
      "experience",
      "skills",
      "custom",
    ]);
  });

  it("rejects values that JSON loses silently (canary for schema drift)", () => {
    // If anyone tries to put a Date or Map into a snapshot, JSON
    // silently coerces / drops them. Document the failure mode here
    // so the next person to extend ResumeSnapshot sees the trap.
    const broken = {
      ...fixture,
      settings: { lastEditedAt: new Date("2026-01-01") } as unknown,
    };
    const wire = JSON.stringify(broken);
    const parsed = JSON.parse(wire);
    // Date became a string — round-trip is NOT structurally equal.
    expect(typeof (parsed.settings as { lastEditedAt: unknown }).lastEditedAt).toBe(
      "string",
    );
    expect(stableStringify(parsed)).not.toBe(stableStringify(broken));
  });
});
