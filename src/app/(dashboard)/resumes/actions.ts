"use server";

import { db } from "@/db";
import {
  resumes,
  resumeBlocks,
  resumeBlockItems,
  resumeVersions,
  careerProfiles,
  workExperiences,
  experienceBullets,
  education,
  skills,
  projects,
  projectBullets,
  certifications,
} from "@/db/schema";
import { eq, and, max, ne, gt, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { BlockType, SourceType } from "@/lib/resume/types";
import { stableStringify } from "@/lib/json/stable";
import { log } from "@/lib/log";
import {
  seedResumeFromProfile,
  seedBlocksForResume,
} from "@/lib/resume/seed";

// Map block types to their source types and default headings
const BLOCK_SOURCE_MAP: Record<
  string,
  { sourceType: SourceType; heading: string }
> = {
  experience: { sourceType: "work_experience", heading: "Work Experience" },
  education: { sourceType: "education", heading: "Education" },
  skills: { sourceType: "skill", heading: "Skills" },
  projects: { sourceType: "project", heading: "Projects" },
  certifications: { sourceType: "certification", heading: "Certifications" },
};

/**
 * Creates a new resume and auto-populates blocks from the user's career profile.
 */
export async function createResume(formData: FormData) {
  const user = await requireUser();

  const title = (formData.get("title") as string) || "Untitled Resume";
  const templateId =
    (formData.get("templateId") as string) || "modern-clean";

  // No profile? Send the user to fill one out first; without it
  // there's nothing to seed the resume from.
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) {
    redirect("/profile");
  }

  const resumeId = await seedResumeFromProfile({
    userId: user.id,
    title,
    templateId,
  });

  redirect(`/resumes/${resumeId}/edit`);
}

/**
 * Rebuild an existing resume's block layout from the current state of
 * the user's career profile. Useful after a fresh import or after the
 * user reorganizes their profile (added Volunteering, moved entries
 * between categories, etc.).
 *
 * Snapshots the resume into the auto_undo stack first so the rebuild
 * is reversible with Ctrl+Z. Title, template, header overrides, and
 * settings on the resume row are preserved — only blocks + items are
 * regenerated.
 */
export async function rebuildResumeFromProfile(resumeId: string) {
  try {
    const user = await requireUser();

    const resume = await db.query.resumes.findFirst({
      where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
    });
    if (!resume) return { error: "Resume not found" };

    // Save the current state into the undo stack so this is reversible
    // — without this, the user would have no way to recover their
    // previous block layout if the rebuild surprises them.
    try {
      await recordUndoCheckpoint(resumeId);
    } catch (err) {
      log.warn("rebuild_undo_snapshot_failed", { resumeId, err });
    }

    // Wipe blocks (cascades to items) then re-seed. Wrapping in a
    // transaction keeps the resume non-empty for any concurrent
    // reader.
    await db.transaction(async (tx) => {
      await tx
        .delete(resumeBlocks)
        .where(eq(resumeBlocks.resumeId, resumeId));
    });
    await seedBlocksForResume(resumeId, user.id);

    revalidatePath(`/resumes/${resumeId}/edit`);
    return { success: true };
  } catch (err) {
    log.error("rebuild_resume_failed", { resumeId, err });
    return {
      error: err instanceof Error ? err.message : "Failed to rebuild",
    };
  }
}

/**
 * Reorder blocks within a resume.
 */
export async function reorderBlocks(
  resumeId: string,
  blockIds: string[]
) {
  const user = await requireUser();

  // Verify resume ownership
  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  // Update sort orders
  await Promise.all(
    blockIds.map((blockId, index) =>
      db
        .update(resumeBlocks)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(
          and(
            eq(resumeBlocks.id, blockId),
            eq(resumeBlocks.resumeId, resumeId)
          )
        )
    )
  );

  revalidatePath(`/resumes/${resumeId}/edit`);
}

/**
 * Reorder items within a block (e.g. reordering education entries).
 * Takes an ordered list of item IDs and writes their sortOrder to match.
 */
export async function reorderItems(
  resumeId: string,
  blockId: string,
  itemIds: string[]
) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  // Verify block belongs to this resume
  const block = await db.query.resumeBlocks.findFirst({
    where: and(
      eq(resumeBlocks.id, blockId),
      eq(resumeBlocks.resumeId, resumeId)
    ),
  });
  if (!block) return;

  await Promise.all(
    itemIds.map((itemId, index) =>
      db
        .update(resumeBlockItems)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(
          and(
            eq(resumeBlockItems.id, itemId),
            eq(resumeBlockItems.blockId, blockId)
          )
        )
    )
  );

  revalidatePath(`/resumes/${resumeId}/edit`);
}

/**
 * Toggle block visibility.
 */
export async function toggleBlockVisibility(
  resumeId: string,
  blockId: string
) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  const block = await db.query.resumeBlocks.findFirst({
    where: and(
      eq(resumeBlocks.id, blockId),
      eq(resumeBlocks.resumeId, resumeId)
    ),
  });
  if (!block) return;

  await db
    .update(resumeBlocks)
    .set({ isVisible: !block.isVisible, updatedAt: new Date() })
    .where(eq(resumeBlocks.id, blockId));

  revalidatePath(`/resumes/${resumeId}/edit`);
}

/**
 * Toggle item visibility within a block.
 */
export async function toggleItemVisibility(
  resumeId: string,
  itemId: string
) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  const item = await db.query.resumeBlockItems.findFirst({
    where: eq(resumeBlockItems.id, itemId),
  });
  if (!item) return;

  await db
    .update(resumeBlockItems)
    .set({ isVisible: !item.isVisible, updatedAt: new Date() })
    .where(eq(resumeBlockItems.id, itemId));

  revalidatePath(`/resumes/${resumeId}/edit`);
}

/**
 * Update the resume title.
 */
export async function updateResumeTitle(resumeId: string, title: string) {
  const user = await requireUser();

  await db
    .update(resumes)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)));

  revalidatePath(`/resumes/${resumeId}/edit`);
}

/**
 * Update block heading override.
 */
export async function updateBlockHeading(
  resumeId: string,
  blockId: string,
  heading: string | null
) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  await db
    .update(resumeBlocks)
    .set({ headingOverride: heading, updatedAt: new Date() })
    .where(
      and(
        eq(resumeBlocks.id, blockId),
        eq(resumeBlocks.resumeId, resumeId)
      )
    );

  revalidatePath(`/resumes/${resumeId}/edit`);
}

/**
 * Update the summary override for the resume.
 */
export async function updateSummary(resumeId: string, summary: string) {
  const user = await requireUser();

  await db
    .update(resumes)
    .set({ summaryOverride: summary || null, updatedAt: new Date() })
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)));

  revalidatePath(`/resumes/${resumeId}/edit`);
}

/**
 * Update a top-level field override on an item (e.g., title, company, degree).
 * Merges with existing overrides - does not replace them.
 */
export async function updateItemField(
  resumeId: string,
  itemId: string,
  field: string,
  value: string | null
) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  const existing = await db.query.resumeBlockItems.findFirst({
    where: eq(resumeBlockItems.id, itemId),
  });
  if (!existing) return;

  const currentOverrides = (existing.overrides ?? {}) as Record<string, unknown>;
  const newOverrides =
    value === null || value === ""
      ? (() => {
          const o = { ...currentOverrides };
          delete o[field];
          return o;
        })()
      : { ...currentOverrides, [field]: value };

  await db
    .update(resumeBlockItems)
    .set({ overrides: newOverrides, updatedAt: new Date() })
    .where(eq(resumeBlockItems.id, itemId));

  revalidatePath(`/resumes/${resumeId}/edit`);
}

/**
 * Update a bullet within an item's overrides (merges with existing overrides).
 */
export async function updateBulletText(
  resumeId: string,
  itemId: string,
  bulletId: string,
  newText: string
) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  const existing = await db.query.resumeBlockItems.findFirst({
    where: eq(resumeBlockItems.id, itemId),
  });
  if (!existing) return;

  const currentOverrides = (existing.overrides ?? {}) as Record<string, unknown>;
  const currentBullets = (currentOverrides.bullets ?? {}) as Record<
    string,
    { text?: string; visible?: boolean }
  >;

  const newOverrides = {
    ...currentOverrides,
    bullets: {
      ...currentBullets,
      [bulletId]: { ...currentBullets[bulletId], text: newText },
    },
  };

  await db
    .update(resumeBlockItems)
    .set({ overrides: newOverrides, updatedAt: new Date() })
    .where(eq(resumeBlockItems.id, itemId));

  revalidatePath(`/resumes/${resumeId}/edit`);
}

/**
 * Deprecated: kept for backward compat - updateItemOverride replaces overrides.
 * Prefer updateItemField and updateBulletText.
 */
export async function updateItemOverride(
  resumeId: string,
  itemId: string,
  overrides: Record<string, unknown>
) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  await db
    .update(resumeBlockItems)
    .set({ overrides, updatedAt: new Date() })
    .where(eq(resumeBlockItems.id, itemId));

  revalidatePath(`/resumes/${resumeId}/edit`);
}

/**
 * Change the template for a resume.
 */
export async function changeTemplate(resumeId: string, templateId: string) {
  const user = await requireUser();

  await db
    .update(resumes)
    .set({ templateId, updatedAt: new Date() })
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)));

  revalidatePath(`/resumes/${resumeId}/edit`);
}

/**
 * Delete a resume.
 */
/**
 * Duplicate an existing resume — copies the resume row plus every block
 * and block-item with their overrides intact. Items still point at the
 * same underlying profile rows (work_experiences, skills, etc.) so
 * editing the profile updates both copies; per-resume overrides stay
 * isolated. Useful for tailoring: clone a base resume, then tweak the
 * copy for a specific role.
 */
export async function cloneResume(sourceResumeId: string) {
  const user = await requireUser();

  const source = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, sourceResumeId), eq(resumes.userId, user.id)),
  });
  if (!source) return;

  // Pre-fetch the source blocks + items outside the transaction so the
  // tx body is purely writes — keeps it short and avoids holding a
  // connection while doing user-data joins.
  const sourceBlocks = await db.query.resumeBlocks.findMany({
    where: eq(resumeBlocks.resumeId, sourceResumeId),
    orderBy: (b, { asc }) => [asc(b.sortOrder)],
    with: {
      items: {
        orderBy: (i, { asc }) => [asc(i.sortOrder)],
      },
    },
  });

  // Insert the new resume row. Carry over header + summary + settings so
  // the clone visually matches the source on first paint; users can then
  // diverge by editing.
  const newResumeId = await db.transaction(async (tx) => {
    const [newResume] = await tx
      .insert(resumes)
      .values({
        userId: user.id,
        title: `${source.title} (copy)`,
        templateId: source.templateId,
        status: "draft",
        headerOverrides: source.headerOverrides,
        summaryOverride: source.summaryOverride,
        settings: source.settings,
      })
      .returning();

    for (const sb of sourceBlocks) {
      const [nb] = await tx
        .insert(resumeBlocks)
        .values({
          resumeId: newResume.id,
          blockType: sb.blockType,
          headingOverride: sb.headingOverride,
          sortOrder: sb.sortOrder,
          isVisible: sb.isVisible,
          config: sb.config,
        })
        .returning();

      if (sb.items.length > 0) {
        await tx.insert(resumeBlockItems).values(
          sb.items.map((si) => ({
            blockId: nb.id,
            sourceType: si.sourceType,
            sourceId: si.sourceId,
            sortOrder: si.sortOrder,
            isVisible: si.isVisible,
            overrides: si.overrides,
          })),
        );
      }
    }

    return newResume.id;
  });

  revalidatePath("/resumes");
  redirect(`/resumes/${newResumeId}/edit`);
}

export async function deleteResume(resumeId: string) {
  const user = await requireUser();

  await db
    .delete(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)));

  redirect("/resumes");
}

// ============================================================
// Add new items to resume sections
// ============================================================

/**
 * Add a new empty item to a block. Creates both the profile item and
 * the resume_block_item that references it.
 */
export async function addItemToBlock(resumeId: string, blockId: string) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  const block = await db.query.resumeBlocks.findFirst({
    where: and(
      eq(resumeBlocks.id, blockId),
      eq(resumeBlocks.resumeId, resumeId)
    ),
  });
  if (!block) return;

  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return;

  // Get next sort order
  const [{ maxOrder }] = await db
    .select({ maxOrder: max(resumeBlockItems.sortOrder) })
    .from(resumeBlockItems)
    .where(eq(resumeBlockItems.blockId, blockId));
  const nextOrder = (maxOrder ?? -1) + 1;

  let sourceType: SourceType | "custom" = "custom";
  let sourceId: string | null = null;

  // Create a profile item based on the block type
  switch (block.blockType) {
    case "experience": {
      // Empty strings instead of placeholder text — the canvas/editor render
      // localized placeholders when the field is empty. Writing real-looking
      // values like "Job Title" leaves stale English on Hebrew resumes.
      const [exp] = await db
        .insert(workExperiences)
        .values({
          profileId: profile.id,
          company: "",
          title: "",
          startDate: new Date().toISOString().split("T")[0],
        })
        .returning();
      sourceType = "work_experience";
      sourceId = exp.id;
      break;
    }
    case "education": {
      const [edu] = await db
        .insert(education)
        .values({
          profileId: profile.id,
          institution: "",
          degree: "",
        })
        .returning();
      sourceType = "education";
      sourceId = edu.id;
      break;
    }
    case "skills": {
      const [skill] = await db
        .insert(skills)
        .values({
          profileId: profile.id,
          name: "",
          category: "",
        })
        .returning();
      sourceType = "skill";
      sourceId = skill.id;
      break;
    }
    case "projects": {
      const [proj] = await db
        .insert(projects)
        .values({
          profileId: profile.id,
          name: "",
        })
        .returning();
      sourceType = "project";
      sourceId = proj.id;
      break;
    }
    case "certifications": {
      const [cert] = await db
        .insert(certifications)
        .values({
          profileId: profile.id,
          name: "",
        })
        .returning();
      sourceType = "certification";
      sourceId = cert.id;
      break;
    }
    case "custom":
    default:
      // Custom items don't have a profile source - data stored in overrides
      sourceType = "custom";
      sourceId = crypto.randomUUID();
      break;
  }

  const [created] = await db
    .insert(resumeBlockItems)
    .values({
      blockId,
      sourceType,
      sourceId: sourceId!,
      sortOrder: nextOrder,
      isVisible: true,
      overrides:
        sourceType === "custom"
          ? { title: "New Item", text: "Description" }
          : {},
    })
    .returning();

  revalidatePath(`/resumes/${resumeId}/edit`);
  return { itemId: created.id };
}

/**
 * Remove an item from a resume (doesn't delete from profile).
 */
export async function removeItemFromBlock(resumeId: string, itemId: string) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  await db.delete(resumeBlockItems).where(eq(resumeBlockItems.id, itemId));

  revalidatePath(`/resumes/${resumeId}/edit`);
}

/**
 * Add a new bullet to an experience or project. Creates the bullet in the
 * profile source table so it's reusable across resumes.
 */
export async function addBulletToItem(
  resumeId: string,
  itemId: string
) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  const item = await db.query.resumeBlockItems.findFirst({
    where: eq(resumeBlockItems.id, itemId),
  });
  if (!item) return;

  let bulletId: string | undefined;
  if (item.sourceType === "work_experience") {
    const [{ maxOrder }] = await db
      .select({ maxOrder: max(experienceBullets.sortOrder) })
      .from(experienceBullets)
      .where(eq(experienceBullets.experienceId, item.sourceId));
    const [created] = await db
      .insert(experienceBullets)
      .values({
        experienceId: item.sourceId,
        // Empty so the canvas shows a localized placeholder.
        text: "",
        sortOrder: (maxOrder ?? -1) + 1,
      })
      .returning();
    bulletId = created.id;
  } else if (item.sourceType === "project") {
    const [{ maxOrder }] = await db
      .select({ maxOrder: max(projectBullets.sortOrder) })
      .from(projectBullets)
      .where(eq(projectBullets.projectId, item.sourceId));
    const [created] = await db
      .insert(projectBullets)
      .values({
        projectId: item.sourceId,
        text: "",
        sortOrder: (maxOrder ?? -1) + 1,
      })
      .returning();
    bulletId = created.id;
  }

  revalidatePath(`/resumes/${resumeId}/edit`);
  return bulletId ? { bulletId } : undefined;
}

/**
 * Delete a bullet from the underlying profile item. Affects all resumes that
 * surface this bullet (matches the override model: the profile is source of
 * truth, resumes override). For this-resume-only hiding, use hideBullet via
 * the chat tool instead.
 */
export async function deleteBullet(
  resumeId: string,
  itemId: string,
  bulletId: string
) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  const item = await db.query.resumeBlockItems.findFirst({
    where: eq(resumeBlockItems.id, itemId),
  });
  if (!item) return;

  if (item.sourceType === "work_experience") {
    await db
      .delete(experienceBullets)
      .where(eq(experienceBullets.id, bulletId));
  } else if (item.sourceType === "project") {
    await db.delete(projectBullets).where(eq(projectBullets.id, bulletId));
  }

  // Clean up any override row pointing to this bullet
  const overrides = (item.overrides ?? {}) as Record<string, unknown>;
  const bullets = (overrides.bullets ?? {}) as Record<string, unknown>;
  if (bullets[bulletId]) {
    delete bullets[bulletId];
    await db
      .update(resumeBlockItems)
      .set({ overrides: { ...overrides, bullets }, updatedAt: new Date() })
      .where(eq(resumeBlockItems.id, itemId));
  }

  revalidatePath(`/resumes/${resumeId}/edit`);
}

/**
 * Reorder bullets within an item. Writes sortOrder on the underlying profile
 * bullet rows.
 */
export async function reorderBullets(
  resumeId: string,
  itemId: string,
  bulletIds: string[]
) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  const item = await db.query.resumeBlockItems.findFirst({
    where: eq(resumeBlockItems.id, itemId),
  });
  if (!item) return;

  if (item.sourceType === "work_experience") {
    await Promise.all(
      bulletIds.map((bulletId, index) =>
        db
          .update(experienceBullets)
          .set({ sortOrder: index, updatedAt: new Date() })
          .where(eq(experienceBullets.id, bulletId)),
      ),
    );
  } else if (item.sourceType === "project") {
    await Promise.all(
      bulletIds.map((bulletId, index) =>
        db
          .update(projectBullets)
          .set({ sortOrder: index, updatedAt: new Date() })
          .where(eq(projectBullets.id, bulletId)),
      ),
    );
  }

  revalidatePath(`/resumes/${resumeId}/edit`);
}

/**
 * Add a new custom section to the resume.
 */
export async function addCustomSection(resumeId: string, heading: string) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  const [{ maxOrder }] = await db
    .select({ maxOrder: max(resumeBlocks.sortOrder) })
    .from(resumeBlocks)
    .where(eq(resumeBlocks.resumeId, resumeId));

  await db.insert(resumeBlocks).values({
    resumeId,
    blockType: "custom",
    headingOverride: heading,
    sortOrder: (maxOrder ?? -1) + 1,
    isVisible: true,
  });

  revalidatePath(`/resumes/${resumeId}/edit`);
}

/**
 * Add an existing-type section (experience, education, etc.) to a resume
 * that doesn't have one yet.
 */
export async function addStandardSection(
  resumeId: string,
  blockType: BlockType
) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  const [{ maxOrder }] = await db
    .select({ maxOrder: max(resumeBlocks.sortOrder) })
    .from(resumeBlocks)
    .where(eq(resumeBlocks.resumeId, resumeId));

  await db.insert(resumeBlocks).values({
    resumeId,
    blockType,
    sortOrder: (maxOrder ?? -1) + 1,
    isVisible: true,
  });

  revalidatePath(`/resumes/${resumeId}/edit`);
}

/**
 * Delete a section from the resume (doesn't affect profile).
 */
export async function deleteBlock(resumeId: string, blockId: string) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  await db
    .delete(resumeBlocks)
    .where(
      and(
        eq(resumeBlocks.id, blockId),
        eq(resumeBlocks.resumeId, resumeId)
      )
    );

  revalidatePath(`/resumes/${resumeId}/edit`);
}

// ============================================================
// Version history
// ============================================================

/**
 * Allocate the next `version_number` for a resume atomically. There's
 * no unique constraint on (resume_id, version_number) in the current
 * schema, so two concurrent saves could each compute MAX+1 and produce
 * duplicates — confusing in the UI and makes the undo cursor wobbly.
 *
 * Fix without a migration: take a Postgres transaction-level advisory
 * lock keyed on the resume id before computing MAX. Concurrent calls
 * for the same resume serialize on the lock; different resumes don't
 * block each other. Lock auto-releases when the transaction commits.
 *
 * The 32-bit hash is "good enough" — collisions only briefly serialize
 * unrelated resumes, no correctness impact.
 */
async function nextVersionNumber(
  tx: Pick<typeof db, "execute"> & {
    select: typeof db.select;
  },
  resumeId: string,
): Promise<number> {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtext(${`resume_versions:${resumeId}`}))`,
  );
  const [{ maxVersion }] = await tx
    .select({ maxVersion: max(resumeVersions.versionNumber) })
    .from(resumeVersions)
    .where(eq(resumeVersions.resumeId, resumeId));
  return (maxVersion ?? 0) + 1;
}

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

/**
 * Overwrite the live resume rows with a saved snapshot. Shared by
 * `restoreResumeVersion` (named history) and `restoreUndoCheckpoint`
 * (the cheap undo stack). Internal helper — not exported as a server
 * action.
 *
 * Wrapped in a transaction: a partial failure during the delete +
 * insert sequence would otherwise leave the resume empty (data loss).
 * We also defensively validate the snapshot shape — a corrupt JSONB
 * blob shouldn't be allowed to wipe blocks before the loop trips.
 */
async function applySnapshot(
  resumeId: string,
  snapshot: ResumeSnapshot,
): Promise<void> {
  if (!snapshot || !Array.isArray(snapshot.blocks)) {
    throw new Error("Snapshot is malformed (missing blocks array)");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(resumes)
      .set({
        title: snapshot.title,
        templateId: snapshot.templateId,
        headerOverrides: snapshot.headerOverrides,
        summaryOverride: snapshot.summaryOverride,
        settings: snapshot.settings,
        updatedAt: new Date(),
      })
      .where(eq(resumes.id, resumeId));

    // Delete all existing blocks (cascades to items)
    await tx.delete(resumeBlocks).where(eq(resumeBlocks.resumeId, resumeId));

    for (const b of snapshot.blocks) {
      const [newBlock] = await tx
        .insert(resumeBlocks)
        .values({
          resumeId,
          blockType: b.blockType,
          headingOverride: b.headingOverride,
          sortOrder: b.sortOrder,
          isVisible: b.isVisible,
          config: b.config,
        })
        .returning();

      if (b.items.length > 0) {
        await tx.insert(resumeBlockItems).values(
          b.items.map((i) => ({
            blockId: newBlock.id,
            sourceType: i.sourceType,
            sourceId: i.sourceId,
            sortOrder: i.sortOrder,
            isVisible: i.isVisible,
            overrides: i.overrides,
          })),
        );
      }
    }
  });
}

async function buildSnapshot(resumeId: string): Promise<ResumeSnapshot> {
  const resume = await db.query.resumes.findFirst({
    where: eq(resumes.id, resumeId),
    with: {
      blocks: {
        with: { items: true },
        orderBy: (b, { asc }) => [asc(b.sortOrder)],
      },
    },
  });
  if (!resume) throw new Error("Resume not found");

  return {
    title: resume.title,
    templateId: resume.templateId,
    headerOverrides: resume.headerOverrides as Record<string, string> | null,
    summaryOverride: resume.summaryOverride,
    settings: resume.settings,
    blocks: resume.blocks.map((b) => ({
      blockType: b.blockType,
      headingOverride: b.headingOverride,
      sortOrder: b.sortOrder,
      isVisible: b.isVisible,
      config: b.config,
      items: b.items
        .sort((a, z) => a.sortOrder - z.sortOrder)
        .map((i) => ({
          sourceType: i.sourceType,
          sourceId: i.sourceId,
          sortOrder: i.sortOrder,
          isVisible: i.isVisible,
          overrides: i.overrides,
        })),
    })),
  };
}

/**
 * Save a named version (snapshot) of the current resume state.
 */
export async function saveResumeVersion(
  resumeId: string,
  changeSummary: string,
  createdBy: "user" | "ai_tailoring" = "user"
) {
  try {
    const user = await requireUser();

    const resume = await db.query.resumes.findFirst({
      where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
    });
    if (!resume) return { error: "Resume not found" };

    const snapshot = await buildSnapshot(resumeId);

    await db.transaction(async (tx) => {
      const versionNumber = await nextVersionNumber(tx, resumeId);
      await tx.insert(resumeVersions).values({
        resumeId,
        versionNumber,
        snapshot,
        changeSummary,
        createdBy,
      });
    });

    revalidatePath(`/resumes/${resumeId}/edit`);
    return { success: true };
  } catch (err) {
    log.error("save_resume_version_failed", { resumeId, err });
    return { error: err instanceof Error ? err.message : "Failed to save version" };
  }
}

/**
 * Get all versions for a resume (metadata only, snapshot kept on server).
 */
export async function getResumeVersions(resumeId: string) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return [];

  return db.query.resumeVersions.findMany({
    where: and(
      eq(resumeVersions.resumeId, resumeId),
      // Hide auto-undo snapshots — they're driven by the editor's
      // implicit undo/redo stack, not the user's named version history.
      ne(resumeVersions.createdBy, "auto_undo"),
    ),
    orderBy: (v, { desc }) => [desc(v.versionNumber)],
  });
}

/**
 * Resolve a version snapshot against current profile data for preview.
 */
export async function getResolvedVersion(
  resumeId: string,
  versionId: string
) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return null;

  const version = await db.query.resumeVersions.findFirst({
    where: and(
      eq(resumeVersions.id, versionId),
      eq(resumeVersions.resumeId, resumeId)
    ),
  });
  if (!version) return null;

  const { resolveSnapshot } = await import("@/lib/resume/resolve");
  return resolveSnapshot(version.snapshot as ResumeSnapshot, user.id, resumeId);
}

/**
 * Compute a structural diff between two resume snapshots. The "left"
 * version is always identified by `versionId`; the "right" is either
 * another `compareWithId` snapshot, or the live resume state if
 * compareWithId is null/missing. Designed to power the version-history
 * "compare" UI.
 */
export async function getVersionDiff(
  resumeId: string,
  versionId: string,
  compareWithId: string | null,
) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return null;

  const left = await db.query.resumeVersions.findFirst({
    where: and(
      eq(resumeVersions.id, versionId),
      eq(resumeVersions.resumeId, resumeId),
    ),
  });
  if (!left) return null;

  let right: ResumeSnapshot;
  let rightLabel: string;
  if (compareWithId) {
    const r = await db.query.resumeVersions.findFirst({
      where: and(
        eq(resumeVersions.id, compareWithId),
        eq(resumeVersions.resumeId, resumeId),
      ),
    });
    if (!r) return null;
    right = r.snapshot as ResumeSnapshot;
    rightLabel = `v${r.versionNumber}`;
  } else {
    right = await buildSnapshot(resumeId);
    rightLabel = "current";
  }

  const { diffSnapshots } = await import("@/lib/resume/diff");
  return {
    leftLabel: `v${left.versionNumber}`,
    rightLabel,
    leftCreatedAt: left.createdAt,
    leftSummary: left.changeSummary,
    diff: diffSnapshots(left.snapshot as ResumeSnapshot, right),
  };
}

/**
 * Restore a resume to a previous version.
 * Wipes current blocks/items and recreates from the snapshot.
 * Creates a new version snapshot of the current state before restoring (auto-save).
 */
export async function restoreResumeVersion(
  resumeId: string,
  versionId: string
) {
  try {
    const user = await requireUser();

    const resume = await db.query.resumes.findFirst({
      where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
    });
    if (!resume) return { error: "Resume not found" };

    const version = await db.query.resumeVersions.findFirst({
      where: and(
        eq(resumeVersions.id, versionId),
        eq(resumeVersions.resumeId, resumeId)
      ),
    });
    if (!version) return { error: "Version not found" };

    // Auto-save current state before restoring
    const currentSnapshot = await buildSnapshot(resumeId);
    await db.transaction(async (tx) => {
      const versionNumber = await nextVersionNumber(tx, resumeId);
      await tx.insert(resumeVersions).values({
        resumeId,
        versionNumber,
        snapshot: currentSnapshot,
        changeSummary: `Auto-saved before restoring v${version.versionNumber}`,
        createdBy: "user",
      });
    });

    await applySnapshot(resumeId, version.snapshot as ResumeSnapshot);

    revalidatePath(`/resumes/${resumeId}/edit`);
    return { success: true };
  } catch (err) {
    log.error("restore_resume_version_failed", { resumeId, versionId, err });
    return { error: err instanceof Error ? err.message : "Failed to restore version" };
  }
}

/**
 * Delete a version from history.
 */
export async function deleteResumeVersion(resumeId: string, versionId: string) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  await db
    .delete(resumeVersions)
    .where(
      and(
        eq(resumeVersions.id, versionId),
        eq(resumeVersions.resumeId, resumeId)
      )
    );

  revalidatePath(`/resumes/${resumeId}/edit`);
}

// ============================================================
// Undo / redo (auto-snapshot stack)
// ============================================================
//
// Cheap undo built on `resume_versions`: every save event triggers a
// snapshot tagged `createdBy="auto_undo"`. The client tracks a cursor
// into that stack — undo restores the previous entry, redo the next.
// `getResumeVersions` filters these out so they don't pollute the
// named version-history UI.

const UNDO_TAG = "auto_undo";
// Cap on auto_undo rows per resume. Each row stores a full JSONB
// snapshot, so unbounded growth is real DB bloat — a chatty session
// could rack up hundreds. 30 entries is enough for "I'd like to walk
// back the last few changes" without keeping the entire edit history.
const UNDO_HISTORY_LIMIT = 30;

/**
 * Snapshot the current resume state as an auto_undo entry. Returns the
 * created row's metadata. Skips if the latest auto_undo snapshot is
 * structurally identical to the current state (avoids stack spam from
 * no-op saves). Trims older auto_undo rows past UNDO_HISTORY_LIMIT.
 */
export async function recordUndoCheckpoint(resumeId: string) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return { error: "Resume not found" };

  const snapshot = await buildSnapshot(resumeId);

  const last = await db.query.resumeVersions.findFirst({
    where: and(
      eq(resumeVersions.resumeId, resumeId),
      eq(resumeVersions.createdBy, UNDO_TAG),
    ),
    orderBy: (v, { desc }) => [desc(v.versionNumber)],
  });
  if (last && stableStringify(last.snapshot) === stableStringify(snapshot)) {
    return { skipped: true as const };
  }

  // Atomic next-version-number allocation under an advisory lock so
  // two concurrent saves don't both produce the same version_number.
  const created = await db.transaction(async (tx) => {
    const versionNumber = await nextVersionNumber(tx, resumeId);
    const [row] = await tx
      .insert(resumeVersions)
      .values({
        resumeId,
        versionNumber,
        snapshot,
        changeSummary: null,
        createdBy: UNDO_TAG,
      })
      .returning();
    return row;
  });

  // Trim oldest auto_undo rows past the cap. Keep the most recent N
  // by versionNumber. Best-effort — failing to trim shouldn't fail
  // the undo capture.
  try {
    const allUndos = await db.query.resumeVersions.findMany({
      where: and(
        eq(resumeVersions.resumeId, resumeId),
        eq(resumeVersions.createdBy, UNDO_TAG),
      ),
      orderBy: (v, { desc }) => [desc(v.versionNumber)],
      columns: { id: true, versionNumber: true },
    });
    if (allUndos.length > UNDO_HISTORY_LIMIT) {
      const toDelete = allUndos.slice(UNDO_HISTORY_LIMIT);
      for (const row of toDelete) {
        await db
          .delete(resumeVersions)
          .where(eq(resumeVersions.id, row.id));
      }
    }
  } catch (err) {
    log.warn("auto_undo_trim_failed", { resumeId, err });
  }

  return {
    id: created.id,
    versionNumber: created.versionNumber,
    createdAt: created.createdAt,
  };
}

/**
 * List undo checkpoints (oldest first). Caller maintains a cursor into
 * the array.
 */
export async function getUndoCheckpoints(resumeId: string) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return [];

  const rows = await db.query.resumeVersions.findMany({
    where: and(
      eq(resumeVersions.resumeId, resumeId),
      eq(resumeVersions.createdBy, UNDO_TAG),
    ),
    orderBy: (v, { asc }) => [asc(v.versionNumber)],
  });
  // Strip snapshot blob from the listing — it's heavy and the client
  // never needs it; restore happens on the server.
  return rows.map((r) => ({
    id: r.id,
    versionNumber: r.versionNumber,
    createdAt: r.createdAt,
  }));
}

/**
 * Restore an undo checkpoint without taking a "before" snapshot. The
 * caller is expected to have already snapshotted whatever they wanted
 * to keep — for the undo stack the answer is "nothing", because the
 * cursor moves through existing entries.
 */
export async function restoreUndoCheckpoint(
  resumeId: string,
  checkpointId: string,
) {
  try {
    const user = await requireUser();

    const resume = await db.query.resumes.findFirst({
      where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
    });
    if (!resume) return { error: "Resume not found" };

    const cp = await db.query.resumeVersions.findFirst({
      where: and(
        eq(resumeVersions.id, checkpointId),
        eq(resumeVersions.resumeId, resumeId),
        eq(resumeVersions.createdBy, UNDO_TAG),
      ),
    });
    if (!cp) return { error: "Checkpoint not found" };

    await applySnapshot(resumeId, cp.snapshot as ResumeSnapshot);
    revalidatePath(`/resumes/${resumeId}/edit`);
    return { success: true };
  } catch (err) {
    log.error("restore_undo_checkpoint_failed", { resumeId, checkpointId, err });
    return {
      error: err instanceof Error ? err.message : "Failed to undo",
    };
  }
}

/**
 * After the user undoes and then makes a fresh edit, the "redo"
 * checkpoints past the cursor are no longer reachable in chronological
 * order and would be confusing if exposed on a refresh. Drop them.
 */
export async function discardUndoCheckpointsAfter(
  resumeId: string,
  versionNumber: number,
) {
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) return;

  await db
    .delete(resumeVersions)
    .where(
      and(
        eq(resumeVersions.resumeId, resumeId),
        eq(resumeVersions.createdBy, UNDO_TAG),
        gt(resumeVersions.versionNumber, versionNumber),
      ),
    );
}
