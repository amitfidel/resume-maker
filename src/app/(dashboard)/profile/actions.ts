"use server";

import { db } from "@/db";
import {
  careerProfiles,
  workExperiences,
  experienceBullets,
  education,
  skills,
  projects,
  projectBullets,
  certifications,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============================================================
// Career Profile
// ============================================================

export async function getCareerProfile() {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  return profile;
}

export async function updateCareerProfile(formData: FormData) {
  const user = await requireUser();

  await db
    .update(careerProfiles)
    .set({
      headline: (formData.get("headline") as string) || null,
      summary: (formData.get("summary") as string) || null,
      location: (formData.get("location") as string) || null,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      linkedinUrl: (formData.get("linkedinUrl") as string) || null,
      githubUrl: (formData.get("githubUrl") as string) || null,
      websiteUrl: (formData.get("websiteUrl") as string) || null,
      updatedAt: new Date(),
    })
    .where(eq(careerProfiles.userId, user.id));

  revalidatePath("/profile");
}

// ============================================================
// Work Experience
// ============================================================

export async function getWorkExperiences() {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return [];

  return db.query.workExperiences.findMany({
    where: eq(workExperiences.profileId, profile.id),
    with: { bullets: true },
    orderBy: (we, { desc }) => [desc(we.sortOrder)],
  });
}

export async function createWorkExperience(formData: FormData) {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return { error: "Profile not found" };

  const [exp] = await db
    .insert(workExperiences)
    .values({
      profileId: profile.id,
      company: formData.get("company") as string,
      title: formData.get("title") as string,
      location: (formData.get("location") as string) || null,
      startDate: formData.get("startDate") as string,
      endDate: (formData.get("endDate") as string) || null,
      isCurrent: formData.get("isCurrent") === "true",
      description: (formData.get("description") as string) || null,
    })
    .returning();

  // Parse bullets from form
  const bulletsRaw = formData.get("bullets") as string;
  if (bulletsRaw) {
    const bulletTexts = bulletsRaw
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);
    if (bulletTexts.length > 0) {
      await db.insert(experienceBullets).values(
        bulletTexts.map((text, i) => ({
          experienceId: exp.id,
          text,
          sortOrder: i,
        }))
      );
    }
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function updateWorkExperience(id: string, formData: FormData) {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return { error: "Profile not found" };

  await db
    .update(workExperiences)
    .set({
      company: formData.get("company") as string,
      title: formData.get("title") as string,
      location: (formData.get("location") as string) || null,
      startDate: formData.get("startDate") as string,
      endDate: (formData.get("endDate") as string) || null,
      isCurrent: formData.get("isCurrent") === "true",
      description: (formData.get("description") as string) || null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workExperiences.id, id),
        eq(workExperiences.profileId, profile.id)
      )
    );

  // Replace bullets
  await db
    .delete(experienceBullets)
    .where(eq(experienceBullets.experienceId, id));

  const bulletsRaw = formData.get("bullets") as string;
  if (bulletsRaw) {
    const bulletTexts = bulletsRaw
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);
    if (bulletTexts.length > 0) {
      await db.insert(experienceBullets).values(
        bulletTexts.map((text, i) => ({
          experienceId: id,
          text,
          sortOrder: i,
        }))
      );
    }
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteWorkExperience(id: string) {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return;

  await db
    .delete(workExperiences)
    .where(
      and(
        eq(workExperiences.id, id),
        eq(workExperiences.profileId, profile.id)
      )
    );

  revalidatePath("/profile");
}

// ============================================================
// Education
// ============================================================

export async function getEducation() {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return [];

  return db.query.education.findMany({
    where: eq(education.profileId, profile.id),
    orderBy: (ed, { desc }) => [desc(ed.sortOrder)],
  });
}

export async function createEducation(formData: FormData) {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return { error: "Profile not found" };

  await db.insert(education).values({
    profileId: profile.id,
    institution: formData.get("institution") as string,
    degree: formData.get("degree") as string,
    fieldOfStudy: (formData.get("fieldOfStudy") as string) || null,
    startDate: (formData.get("startDate") as string) || null,
    endDate: (formData.get("endDate") as string) || null,
    gpa: (formData.get("gpa") as string) || null,
    description: (formData.get("description") as string) || null,
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function updateEducation(id: string, formData: FormData) {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return { error: "Profile not found" };

  await db
    .update(education)
    .set({
      institution: formData.get("institution") as string,
      degree: formData.get("degree") as string,
      fieldOfStudy: (formData.get("fieldOfStudy") as string) || null,
      startDate: (formData.get("startDate") as string) || null,
      endDate: (formData.get("endDate") as string) || null,
      gpa: (formData.get("gpa") as string) || null,
      description: (formData.get("description") as string) || null,
      updatedAt: new Date(),
    })
    .where(and(eq(education.id, id), eq(education.profileId, profile.id)));

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteEducation(id: string) {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return;

  await db
    .delete(education)
    .where(and(eq(education.id, id), eq(education.profileId, profile.id)));

  revalidatePath("/profile");
}

// ============================================================
// Skills
// ============================================================

export async function getSkills() {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return [];

  return db.query.skills.findMany({
    where: eq(skills.profileId, profile.id),
    orderBy: (s, { asc }) => [asc(s.category), asc(s.sortOrder)],
  });
}

export async function createSkill(formData: FormData) {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return { error: "Profile not found" };

  await db.insert(skills).values({
    profileId: profile.id,
    name: formData.get("name") as string,
    category: (formData.get("category") as string) || null,
    proficiency: (formData.get("proficiency") as string) || null,
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteSkill(id: string) {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return;

  await db
    .delete(skills)
    .where(and(eq(skills.id, id), eq(skills.profileId, profile.id)));

  revalidatePath("/profile");
}

// ============================================================
// Projects
// ============================================================

export async function getProjects() {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return [];

  return db.query.projects.findMany({
    where: eq(projects.profileId, profile.id),
    with: { bullets: true },
    orderBy: (p, { desc }) => [desc(p.sortOrder)],
  });
}

export async function createProject(formData: FormData) {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return { error: "Profile not found" };

  const technologiesRaw = formData.get("technologies") as string;
  const technologies = technologiesRaw
    ? technologiesRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : null;

  const [proj] = await db
    .insert(projects)
    .values({
      profileId: profile.id,
      name: formData.get("name") as string,
      url: (formData.get("url") as string) || null,
      description: (formData.get("description") as string) || null,
      technologies,
      startDate: (formData.get("startDate") as string) || null,
      endDate: (formData.get("endDate") as string) || null,
    })
    .returning();

  const bulletsRaw = formData.get("bullets") as string;
  if (bulletsRaw) {
    const bulletTexts = bulletsRaw
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);
    if (bulletTexts.length > 0) {
      await db.insert(projectBullets).values(
        bulletTexts.map((text, i) => ({
          projectId: proj.id,
          text,
          sortOrder: i,
        }))
      );
    }
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteProject(id: string) {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return;

  await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.profileId, profile.id)));

  revalidatePath("/profile");
}

// ============================================================
// Certifications
// ============================================================

export async function getCertifications() {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return [];

  return db.query.certifications.findMany({
    where: eq(certifications.profileId, profile.id),
    orderBy: (c, { desc }) => [desc(c.sortOrder)],
  });
}

export async function createCertification(formData: FormData) {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return { error: "Profile not found" };

  await db.insert(certifications).values({
    profileId: profile.id,
    name: formData.get("name") as string,
    issuer: (formData.get("issuer") as string) || null,
    issueDate: (formData.get("issueDate") as string) || null,
    expiryDate: (formData.get("expiryDate") as string) || null,
    credentialUrl: (formData.get("credentialUrl") as string) || null,
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteCertification(id: string) {
  const user = await requireUser();
  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });
  if (!profile) return;

  await db
    .delete(certifications)
    .where(
      and(eq(certifications.id, id), eq(certifications.profileId, profile.id))
    );

  revalidatePath("/profile");
}
