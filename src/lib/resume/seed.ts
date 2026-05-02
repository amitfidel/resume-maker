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
import { eq } from "drizzle-orm";

/**
 * Build a fresh resume from the user's career profile, populating
 * blocks in a sensible default order. Pure DB writes — no auth check
 * (callers do that), no redirect (callers do that). Returns the new
 * resume's id.
 *
 * Block layout, top to bottom:
 *   1. Summary (if profile.summary is set)
 *   2. Work Experience  (work_experiences with category='work')
 *   3. Military Service (work_experiences with category='military')
 *   4. Volunteering     (work_experiences with category='volunteer')
 *   5. Education
 *   6. Skills
 *   7. Projects
 *   8. Certifications
 *
 * The three "experience" buckets all use blockType="experience" so
 * they share the existing renderer; only the heading differs. When a
 * bucket is empty its block isn't created at all.
 */
export async function seedResumeFromProfile(args: {
  userId: string;
  title: string;
  templateId: string;
}): Promise<string> {
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, args.userId),
  });
  if (!profile) {
    throw new Error("Career profile not found for user");
  }

  // Insert the resume row first.
  const [resume] = await db
    .insert(resumes)
    .values({
      userId: args.userId,
      title: args.title,
      templateId: args.templateId,
      status: "draft",
    })
    .returning();

  // Pull all profile data in parallel.
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

  let sortOrder = 0;

  // Summary
  if (profile.summary) {
    await db.insert(resumeBlocks).values({
      resumeId: resume.id,
      blockType: "summary",
      sortOrder: sortOrder++,
    });
  }

  // Three experience buckets keyed off work_experiences.category.
  const workEntries = expList.filter(
    (e) => (e.category ?? "work") === "work",
  );
  const militaryEntries = expList.filter((e) => e.category === "military");
  const volunteerEntries = expList.filter((e) => e.category === "volunteer");

  const expBuckets: Array<{
    entries: typeof expList;
    heading: string | null;
  }> = [
    { entries: workEntries, heading: null },
    { entries: militaryEntries, heading: "Military Service" },
    { entries: volunteerEntries, heading: "Volunteering" },
  ];

  for (const bucket of expBuckets) {
    if (bucket.entries.length === 0) continue;
    const [block] = await db
      .insert(resumeBlocks)
      .values({
        resumeId: resume.id,
        blockType: "experience",
        headingOverride: bucket.heading,
        sortOrder: sortOrder++,
      })
      .returning();

    await db.insert(resumeBlockItems).values(
      bucket.entries.map((exp, i) => ({
        blockId: block.id,
        sourceType: "work_experience" as const,
        sourceId: exp.id,
        sortOrder: i,
      })),
    );
  }

  // Education
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
      })),
    );
  }

  // Skills
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
      })),
    );
  }

  // Projects
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
      })),
    );
  }

  // Certifications
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
      })),
    );
  }

  return resume.id;
}
