"use server";

import { db } from "@/db";
import {
  resumes,
  resumeBlocks,
  resumeBlockItems,
  careerProfiles,
  workExperiences,
  education,
  skills,
  projects,
  certifications,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
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
 * Update an item's text override (e.g., a bullet point).
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
