"use server";

import { db } from "@/db";
import { coverLetters, resumes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { log } from "@/lib/log";

/**
 * Cover-letter CRUD. The CL belongs to a resume so the share/clone/
 * export flows can carry it along. Ownership is checked via the
 * parent resume's user_id at every entry point.
 */

async function ownsResume(resumeId: string, userId: string) {
  const r = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, userId)),
  });
  return Boolean(r);
}

export async function listCoverLetters(resumeId: string) {
  const user = await requireUser();
  if (!(await ownsResume(resumeId, user.id))) return [];
  return db.query.coverLetters.findMany({
    where: eq(coverLetters.resumeId, resumeId),
    orderBy: (c) => [desc(c.updatedAt)],
  });
}

export async function getCoverLetter(coverLetterId: string) {
  const user = await requireUser();
  const row = await db.query.coverLetters.findFirst({
    where: and(
      eq(coverLetters.id, coverLetterId),
      eq(coverLetters.userId, user.id),
    ),
  });
  return row ?? null;
}

export async function createCoverLetter(
  resumeId: string,
  init?: { title?: string; jobDescription?: string },
) {
  const user = await requireUser();
  if (!(await ownsResume(resumeId, user.id))) {
    return { error: "Resume not found" };
  }
  const [row] = await db
    .insert(coverLetters)
    .values({
      resumeId,
      userId: user.id,
      title: init?.title?.trim() || "Cover Letter",
      jobDescription: init?.jobDescription ?? null,
      body: "",
    })
    .returning();
  revalidatePath(`/resumes/${resumeId}/edit`);
  return { id: row.id };
}

export async function updateCoverLetter(
  coverLetterId: string,
  patch: {
    title?: string;
    body?: string;
    jobDescription?: string | null;
    recipientName?: string | null;
    recipientCompany?: string | null;
    status?: "draft" | "final";
  },
) {
  const user = await requireUser();
  const existing = await db.query.coverLetters.findFirst({
    where: and(
      eq(coverLetters.id, coverLetterId),
      eq(coverLetters.userId, user.id),
    ),
  });
  if (!existing) return { error: "Cover letter not found" };

  await db
    .update(coverLetters)
    .set({
      title: patch.title ?? existing.title,
      body: patch.body ?? existing.body,
      jobDescription:
        patch.jobDescription === undefined
          ? existing.jobDescription
          : patch.jobDescription,
      recipientName:
        patch.recipientName === undefined
          ? existing.recipientName
          : patch.recipientName,
      recipientCompany:
        patch.recipientCompany === undefined
          ? existing.recipientCompany
          : patch.recipientCompany,
      status: patch.status ?? existing.status,
      updatedAt: new Date(),
    })
    .where(eq(coverLetters.id, coverLetterId));

  revalidatePath(`/resumes/${existing.resumeId}/edit`);
  return { success: true };
}

export async function deleteCoverLetter(coverLetterId: string) {
  const user = await requireUser();
  const existing = await db.query.coverLetters.findFirst({
    where: and(
      eq(coverLetters.id, coverLetterId),
      eq(coverLetters.userId, user.id),
    ),
  });
  if (!existing) return;
  await db.delete(coverLetters).where(eq(coverLetters.id, coverLetterId));
  revalidatePath(`/resumes/${existing.resumeId}/edit`);
}

/**
 * Persist whatever the AI streamed back. Called after the streaming
 * generation completes — the client sees the deltas, but the durable
 * write happens via this server action so we don't double-write per
 * keystroke.
 */
export async function saveGeneratedCoverLetter(
  coverLetterId: string,
  body: string,
  jobDescription: string | null,
) {
  const user = await requireUser();
  const existing = await db.query.coverLetters.findFirst({
    where: and(
      eq(coverLetters.id, coverLetterId),
      eq(coverLetters.userId, user.id),
    ),
  });
  if (!existing) return { error: "Cover letter not found" };

  await db
    .update(coverLetters)
    .set({
      body,
      jobDescription,
      updatedAt: new Date(),
    })
    .where(eq(coverLetters.id, coverLetterId));

  log.info("cover_letter_generated", {
    coverLetterId,
    bodyChars: body.length,
  });

  revalidatePath(`/resumes/${existing.resumeId}/edit`);
  return { success: true };
}
