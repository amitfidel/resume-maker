"use server";

import { db } from "@/db";
import {
  resumes,
  resumeBlocks,
  resumeBlockItems,
  careerProfiles,
  workExperiences,
  experienceBullets,
  education,
  skills,
  projects,
  projectBullets,
  certifications,
} from "@/db/schema";
import { eq, and, max } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { BlockType, SourceType } from "@/lib/resume/types";

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

  // Get career profile
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });

  if (!profile) {
    redirect("/profile");
  }

  // Create resume
  const [resume] = await db
    .insert(resumes)
    .values({
      userId: user.id,
      title,
      templateId,
      status: "draft",
    })
    .returning();

  // Load all profile items to populate blocks
  const [expList, eduList, skillList, projList, certList] = await Promise.all([
    db.query.workExperiences.findMany({
      where: eq(workExperiences.profileId, profile.id),
      orderBy: (e, { desc }) => [desc(e.sortOrder)],
    }),
    db.query.education.findMany({
      where: eq(education.profileId, profile.id),
      orderBy: (e, { desc }) => [desc(e.sortOrder)],
    }),
    db.query.skills.findMany({
      where: eq(skills.profileId, profile.id),
      orderBy: (s, { asc }) => [asc(s.category), asc(s.sortOrder)],
    }),
    db.query.projects.findMany({
      where: eq(projects.profileId, profile.id),
      orderBy: (p, { desc }) => [desc(p.sortOrder)],
    }),
    db.query.certifications.findMany({
      where: eq(certifications.profileId, profile.id),
      orderBy: (c, { desc }) => [desc(c.sortOrder)],
    }),
  ]);

  // Create blocks in standard order and populate with profile items
  let sortOrder = 0;

  // Summary block (always included if profile has a summary)
  if (profile.summary) {
    await db.insert(resumeBlocks).values({
      resumeId: resume.id,
      blockType: "summary",
      sortOrder: sortOrder++,
    });
  }

  // Experience block
  if (expList.length > 0) {
    const [block] = await db
      .insert(resumeBlocks)
      .values({
        resumeId: resume.id,
        blockType: "experience",
        sortOrder: sortOrder++,
      })
      .returning();

    await db.insert(resumeBlockItems).values(
      expList.map((exp, i) => ({
        blockId: block.id,
        sourceType: "work_experience" as const,
        sourceId: exp.id,
        sortOrder: i,
      }))
    );
  }

  // Education block
  if (eduList.length > 0) {
    const [block] = await db
      .insert(resumeBlocks)
      .values({
        resumeId: resume.id,
        blockType: "education",
        sortOrder: sortOrder++,
      })
      .returning();

    await db.insert(resumeBlockItems).values(
      eduList.map((edu, i) => ({
        blockId: block.id,
        sourceType: "education" as const,
        sourceId: edu.id,
        sortOrder: i,
      }))
    );
  }

  // Skills block
  if (skillList.length > 0) {
    const [block] = await db
      .insert(resumeBlocks)
      .values({
        resumeId: resume.id,
        blockType: "skills",
        sortOrder: sortOrder++,
      })
      .returning();

    await db.insert(resumeBlockItems).values(
      skillList.map((skill, i) => ({
        blockId: block.id,
        sourceType: "skill" as const,
        sourceId: skill.id,
        sortOrder: i,
      }))
    );
  }

  // Projects block
  if (projList.length > 0) {
    const [block] = await db
      .insert(resumeBlocks)
      .values({
        resumeId: resume.id,
        blockType: "projects",
        sortOrder: sortOrder++,
      })
      .returning();

    await db.insert(resumeBlockItems).values(
      projList.map((proj, i) => ({
        blockId: block.id,
        sourceType: "project" as const,
        sourceId: proj.id,
        sortOrder: i,
      }))
    );
  }

  // Certifications block
  if (certList.length > 0) {
    const [block] = await db
      .insert(resumeBlocks)
      .values({
        resumeId: resume.id,
        blockType: "certifications",
        sortOrder: sortOrder++,
      })
      .returning();

    await db.insert(resumeBlockItems).values(
      certList.map((cert, i) => ({
        blockId: block.id,
        sourceType: "certification" as const,
        sourceId: cert.id,
        sortOrder: i,
      }))
    );
  }

  redirect(`/resumes/${resume.id}/edit`);
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
      const [exp] = await db
        .insert(workExperiences)
        .values({
          profileId: profile.id,
          company: "Company",
          title: "Job Title",
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
          institution: "University",
          degree: "Degree",
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
          name: "New Skill",
          category: "Other",
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
          name: "Project Name",
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
          name: "Certification Name",
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

  await db.insert(resumeBlockItems).values({
    blockId,
    sourceType,
    sourceId: sourceId!,
    sortOrder: nextOrder,
    isVisible: true,
    overrides:
      sourceType === "custom"
        ? { title: "New Item", text: "Description" }
        : {},
  });

  revalidatePath(`/resumes/${resumeId}/edit`);
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

  if (item.sourceType === "work_experience") {
    const [{ maxOrder }] = await db
      .select({ maxOrder: max(experienceBullets.sortOrder) })
      .from(experienceBullets)
      .where(eq(experienceBullets.experienceId, item.sourceId));
    await db.insert(experienceBullets).values({
      experienceId: item.sourceId,
      text: "New accomplishment or responsibility",
      sortOrder: (maxOrder ?? -1) + 1,
    });
  } else if (item.sourceType === "project") {
    const [{ maxOrder }] = await db
      .select({ maxOrder: max(projectBullets.sortOrder) })
      .from(projectBullets)
      .where(eq(projectBullets.projectId, item.sourceId));
    await db.insert(projectBullets).values({
      projectId: item.sourceId,
      text: "New point",
      sortOrder: (maxOrder ?? -1) + 1,
    });
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
