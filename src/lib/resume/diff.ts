/**
 * Snapshot-to-snapshot diff. Powers the "compare versions" UI in
 * version history.
 *
 * The input shape mirrors `ResumeSnapshot` from the resumes server
 * actions (kept here as a duplicate type to avoid pulling a "use
 * server" file into client code). Two snapshots come in, a structured
 * change list comes out — flat enough that the UI can group it by
 * section and render side-by-side without doing its own walk.
 *
 * What we diff:
 *   - top-level resume fields (title, templateId, summary, header)
 *   - settings (shallow stringify compare)
 *   - block ordering changes (block X moved from index 2 to index 0)
 *   - block visibility toggles
 *   - block heading overrides
 *   - per-item overrides (added field, changed field, cleared field)
 *   - item insertions / deletions
 *   - item ordering changes within a block
 *
 * What we DON'T diff:
 *   - underlying profile data — the snapshot stores the override-only
 *     view. If a profile bullet's text changed but the override didn't,
 *     both snapshots reference the same sourceId and our diff says
 *     "no change". This is correct: a snapshot represents the
 *     resume's intentional override layer, not a frozen copy of the
 *     profile.
 */

export type SnapshotItem = {
  sourceType: string;
  sourceId: string;
  sortOrder: number;
  isVisible: boolean;
  overrides: Record<string, unknown> | null;
};

export type SnapshotBlock = {
  blockType: string;
  headingOverride: string | null;
  sortOrder: number;
  isVisible: boolean;
  config: Record<string, unknown> | null;
  items: SnapshotItem[];
};

export type SnapshotForDiff = {
  title: string;
  templateId: string;
  headerOverrides: Record<string, string> | null;
  summaryOverride: string | null;
  settings: Record<string, unknown> | null;
  blocks: SnapshotBlock[];
};

export type FieldChange = {
  kind: "field-changed" | "field-added" | "field-removed";
  field: string;
  before: unknown;
  after: unknown;
};

export type BlockChange = {
  // Identity is by (blockType + index-of-blockType-in-snapshot). We
  // can't use an ID because raw snapshots don't carry resume_blocks.id
  // — they're recreated on restore with new IDs.
  blockKey: string;
  blockType: string;
  // Human-friendly heading at the time of the diff (after's heading,
  // falling back to before's). The UI shows this as the section title.
  heading: string;
  changes: FieldChange[];
  // Item-level changes within this block. Items are matched by
  // sourceId+sourceType — the same profile entry, regardless of where
  // it sits.
  itemChanges: ItemChange[];
};

export type ItemChange = {
  sourceType: string;
  sourceId: string;
  kind: "item-added" | "item-removed" | "item-modified" | "item-reordered";
  changes: FieldChange[];
  // For reorders: the before/after sortOrder.
  beforeSortOrder?: number;
  afterSortOrder?: number;
  // First few characters of an identifying field — e.g. job title or
  // skill name — so the UI can label the row without re-resolving
  // against the profile.
  label: string;
};

export type SnapshotDiff = {
  // Top-level fields outside of blocks.
  resumeChanges: FieldChange[];
  // Section-level changes, grouped by block.
  blocks: BlockChange[];
  // Blocks that were added in `after` (not in `before`).
  blocksAdded: BlockChange[];
  // Blocks that were removed (in `before` only).
  blocksRemoved: BlockChange[];
  // Convenience flag for the UI.
  hasAnyChange: boolean;
};

function diffMaps(
  beforeMap: Record<string, unknown> | null | undefined,
  afterMap: Record<string, unknown> | null | undefined,
  prefix = "",
): FieldChange[] {
  const before = beforeMap ?? {};
  const after = afterMap ?? {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes: FieldChange[] = [];
  for (const k of keys) {
    const b = (before as Record<string, unknown>)[k];
    const a = (after as Record<string, unknown>)[k];
    if (b === undefined && a !== undefined) {
      changes.push({
        kind: "field-added",
        field: prefix ? `${prefix}.${k}` : k,
        before: undefined,
        after: a,
      });
    } else if (a === undefined && b !== undefined) {
      changes.push({
        kind: "field-removed",
        field: prefix ? `${prefix}.${k}` : k,
        before: b,
        after: undefined,
      });
    } else if (!shallowEqual(b, a)) {
      changes.push({
        kind: "field-changed",
        field: prefix ? `${prefix}.${k}` : k,
        before: b,
        after: a,
      });
    }
  }
  return changes;
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

/**
 * Best-effort label for a snapshot item. Reads common fields off the
 * overrides — title, name, degree — so the UI has something to show
 * on the diff row without joining back to the profile.
 */
function itemLabel(item: SnapshotItem): string {
  const o = (item.overrides ?? {}) as Record<string, unknown>;
  const candidates = [
    o.title,
    o.name,
    o.degree,
    o.institution,
    o.company,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim().slice(0, 60);
  }
  // Fall back to the source type + id — at least the user can see
  // *something* changed on this row.
  return `${item.sourceType} ${item.sourceId.slice(0, 8)}`;
}

function blockHeading(b: SnapshotBlock): string {
  if (b.headingOverride) return b.headingOverride;
  // Default heading per type — keeps in sync with DEFAULT_HEADINGS in
  // resume/types.ts but duplicated here so this module stays
  // dependency-light (no React, no Drizzle).
  switch (b.blockType) {
    case "summary": return "Summary";
    case "experience": return "Experience";
    case "education": return "Education";
    case "skills": return "Skills";
    case "projects": return "Projects";
    case "certifications": return "Certifications";
    case "custom": return "Additional";
    default: return b.blockType;
  }
}

/**
 * Match blocks across two snapshots by (blockType, occurrence index).
 * A user with two custom blocks will see them paired by position
 * within their type — good enough for the common case of "Awards" +
 * "Volunteering" both being custom.
 */
function indexBlocks(blocks: SnapshotBlock[]): Map<string, SnapshotBlock> {
  const out = new Map<string, SnapshotBlock>();
  const counts = new Map<string, number>();
  for (const b of blocks) {
    const n = counts.get(b.blockType) ?? 0;
    counts.set(b.blockType, n + 1);
    out.set(`${b.blockType}#${n}`, b);
  }
  return out;
}

function indexItems(items: SnapshotItem[]): Map<string, SnapshotItem> {
  const out = new Map<string, SnapshotItem>();
  for (const i of items) {
    out.set(`${i.sourceType}:${i.sourceId}`, i);
  }
  return out;
}

function diffBlock(
  before: SnapshotBlock | undefined,
  after: SnapshotBlock | undefined,
  blockKey: string,
): BlockChange {
  const heading = blockHeading(after ?? before!);
  const changes: FieldChange[] = [];

  if (before && after) {
    if (before.headingOverride !== after.headingOverride) {
      changes.push({
        kind: "field-changed",
        field: "heading",
        before: before.headingOverride,
        after: after.headingOverride,
      });
    }
    if (before.isVisible !== after.isVisible) {
      changes.push({
        kind: "field-changed",
        field: "visibility",
        before: before.isVisible,
        after: after.isVisible,
      });
    }
    if (before.sortOrder !== after.sortOrder) {
      changes.push({
        kind: "field-changed",
        field: "position",
        before: before.sortOrder,
        after: after.sortOrder,
      });
    }
    changes.push(...diffMaps(before.config, after.config, "config"));
  }

  // Item-level diff.
  const itemChanges: ItemChange[] = [];
  const beforeItems = indexItems(before?.items ?? []);
  const afterItems = indexItems(after?.items ?? []);

  // Removed items.
  for (const [key, b] of beforeItems) {
    if (!afterItems.has(key)) {
      itemChanges.push({
        sourceType: b.sourceType,
        sourceId: b.sourceId,
        kind: "item-removed",
        changes: [],
        label: itemLabel(b),
      });
    }
  }

  // Added + modified items.
  for (const [key, a] of afterItems) {
    const b = beforeItems.get(key);
    if (!b) {
      itemChanges.push({
        sourceType: a.sourceType,
        sourceId: a.sourceId,
        kind: "item-added",
        changes: [],
        label: itemLabel(a),
      });
      continue;
    }
    const overrideChanges = diffMaps(b.overrides, a.overrides);
    const visChanged = b.isVisible !== a.isVisible;
    const reordered = b.sortOrder !== a.sortOrder;
    if (overrideChanges.length === 0 && !visChanged && !reordered) continue;

    const fieldChanges: FieldChange[] = overrideChanges;
    if (visChanged) {
      fieldChanges.push({
        kind: "field-changed",
        field: "visibility",
        before: b.isVisible,
        after: a.isVisible,
      });
    }

    itemChanges.push({
      sourceType: a.sourceType,
      sourceId: a.sourceId,
      kind: reordered && fieldChanges.length === 0
        ? "item-reordered"
        : "item-modified",
      changes: fieldChanges,
      beforeSortOrder: b.sortOrder,
      afterSortOrder: a.sortOrder,
      label: itemLabel(a),
    });
  }

  return {
    blockKey,
    blockType: (after ?? before)!.blockType,
    heading,
    changes,
    itemChanges,
  };
}

export function diffSnapshots(
  before: SnapshotForDiff,
  after: SnapshotForDiff,
): SnapshotDiff {
  // Top-level resume fields.
  const resumeChanges: FieldChange[] = [];
  if (before.title !== after.title) {
    resumeChanges.push({
      kind: "field-changed",
      field: "title",
      before: before.title,
      after: after.title,
    });
  }
  if (before.templateId !== after.templateId) {
    resumeChanges.push({
      kind: "field-changed",
      field: "template",
      before: before.templateId,
      after: after.templateId,
    });
  }
  if ((before.summaryOverride ?? "") !== (after.summaryOverride ?? "")) {
    resumeChanges.push({
      kind: "field-changed",
      field: "summary",
      before: before.summaryOverride,
      after: after.summaryOverride,
    });
  }
  resumeChanges.push(
    ...diffMaps(before.headerOverrides, after.headerOverrides, "header"),
  );
  resumeChanges.push(...diffMaps(before.settings, after.settings, "settings"));

  // Block-level diff.
  const beforeMap = indexBlocks(before.blocks);
  const afterMap = indexBlocks(after.blocks);
  const allKeys = new Set([...beforeMap.keys(), ...afterMap.keys()]);

  const blocks: BlockChange[] = [];
  const blocksAdded: BlockChange[] = [];
  const blocksRemoved: BlockChange[] = [];
  for (const key of allKeys) {
    const b = beforeMap.get(key);
    const a = afterMap.get(key);
    if (!b && a) {
      blocksAdded.push(diffBlock(undefined, a, key));
    } else if (b && !a) {
      blocksRemoved.push(diffBlock(b, undefined, key));
    } else if (b && a) {
      const blockDiff = diffBlock(b, a, key);
      if (blockDiff.changes.length > 0 || blockDiff.itemChanges.length > 0) {
        blocks.push(blockDiff);
      }
    }
  }

  const hasAnyChange =
    resumeChanges.length > 0 ||
    blocks.length > 0 ||
    blocksAdded.length > 0 ||
    blocksRemoved.length > 0;

  return {
    resumeChanges,
    blocks,
    blocksAdded,
    blocksRemoved,
    hasAnyChange,
  };
}
