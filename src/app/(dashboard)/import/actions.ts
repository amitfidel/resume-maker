"use server";

import { db } from "@/db";
import {
  users,
  careerProfiles,
  workExperiences,
  experienceBullets,
  education,
  skills,
  projects,
  projectBullets,
  certifications,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { seedResumeFromProfile } from "@/lib/resume/seed";

type ParsedResume = {
  fullName: string;
  headline: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  summary: string | null;
  workExperiences: Array<{
    company: string;
    title: string;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
    bullets: string[];
    category?: "work" | "military" | "volunteer";
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string | null;
    startDate: string | null;
    endDate: string | null;
    gpa: string | null;
  }>;
  skills: Array<{ name: string; category: string | null }>;
  projects: Array<{
    name: string;
    description: string | null;
    technologies: string[];
    bullets: string[];
  }>;
  certifications: Array<{
    name: string;
    issuer: string | null;
    issueDate: string | null;
  }>;
};

export async function saveImportedProfile(data: ParsedResume) {
  const user = await requireUser();

  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });

  if (!profile) return { error: "Profile not found" };

  // Update user name if provided
  if (data.fullName) {
    await db
      .update(users)
      .set({ fullName: data.fullName, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }

  // Update career profile
  await db
    .update(careerProfiles)
    .set({
      headline: data.headline ?? profile.headline,
      summary: data.summary ?? profile.summary,
      location: data.location ?? profile.location,
      phone: data.phone ?? profile.phone,
      email: data.email ?? profile.email,
      linkedinUrl: data.linkedinUrl ?? profile.linkedinUrl,
      githubUrl: data.githubUrl ?? profile.githubUrl,
      websiteUrl: data.websiteUrl ?? profile.websiteUrl,
      updatedAt: new Date(),
    })
    .where(eq(careerProfiles.id, profile.id));

  // Add work experiences
  for (let i = 0; i < data.workExperiences.length; i++) {
    const exp = data.workExperiences[i];
    const [inserted] = await db
      .insert(workExperiences)
      .values({
        profileId: profile.id,
        company: exp.company,
        title: exp.title,
        location: exp.location,
        startDate: exp.startDate ?? "2020-01-01",
        endDate: exp.endDate,
        isCurrent: exp.isCurrent,
        category: exp.category ?? "work",
        sortOrder: i,
      })
      .returning();

    if (exp.bullets.length > 0) {
      await db.insert(experienceBullets).values(
        exp.bullets.map((text, j) => ({
          experienceId: inserted.id,
          text,
          sortOrder: j,
        }))
      );
    }
  }

  // Add education
  for (let i = 0; i < data.education.length; i++) {
    const edu = data.education[i];
    await db.insert(education).values({
      profileId: profile.id,
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      startDate: edu.startDate,
      endDate: edu.endDate,
      gpa: edu.gpa,
      sortOrder: i,
    });
  }

  // Add skills
  for (let i = 0; i < data.skills.length; i++) {
    const skill = data.skills[i];
    await db.insert(skills).values({
      profileId: profile.id,
      name: skill.name,
      category: skill.category,
      sortOrder: i,
    });
  }

  // Add projects
  for (let i = 0; i < data.projects.length; i++) {
    const proj = data.projects[i];
    const [inserted] = await db
      .insert(projects)
      .values({
        profileId: profile.id,
        name: proj.name,
        description: proj.description,
        technologies: proj.technologies,
        sortOrder: i,
      })
      .returning();

    if (proj.bullets.length > 0) {
      await db.insert(projectBullets).values(
        proj.bullets.map((text, j) => ({
          projectId: inserted.id,
          text,
          sortOrder: j,
        }))
      );
    }
  }

  // Add certifications
  for (let i = 0; i < data.certifications.length; i++) {
    const cert = data.certifications[i];
    await db.insert(certifications).values({
      profileId: profile.id,
      name: cert.name,
      issuer: cert.issuer,
      issueDate: cert.issueDate,
      sortOrder: i,
    });
  }

  // Build a starter resume from the freshly-imported data so the user
  // lands directly in the editor with everything in place — they
  // shouldn't have to make a separate trip through /resumes/new.
  // Title comes from the resume's owner name; the editor lets them
  // rename it later.
  const resumeId = await seedResumeFromProfile({
    userId: user.id,
    title: `${data.fullName || "My"} — Imported Resume`,
    templateId: "modern-clean",
  });

  return { success: true, resumeId };
}
