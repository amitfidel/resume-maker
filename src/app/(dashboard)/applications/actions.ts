"use server";

import { db } from "@/db";
import { jobApplications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getApplications() {
  const user = await requireUser();
  return db.query.jobApplications.findMany({
    where: eq(jobApplications.userId, user.id),
    orderBy: (a, { desc }) => [desc(a.updatedAt)],
  });
}

export async function createApplication(formData: FormData) {
  const user = await requireUser();

  await db.insert(jobApplications).values({
    userId: user.id,
    company: formData.get("company") as string,
    position: formData.get("position") as string,
    jobUrl: (formData.get("jobUrl") as string) || null,
    status: (formData.get("status") as string) || "saved",
    appliedDate: (formData.get("appliedDate") as string) || null,
    notes: (formData.get("notes") as string) || null,
    salaryRange: (formData.get("salaryRange") as string) || null,
  });

  revalidatePath("/applications");
}

export async function updateApplicationStatus(id: string, status: string) {
  const user = await requireUser();

  await db
    .update(jobApplications)
    .set({ status, updatedAt: new Date() })
    .where(
      and(eq(jobApplications.id, id), eq(jobApplications.userId, user.id))
    );

  revalidatePath("/applications");
}

export async function deleteApplication(id: string) {
  const user = await requireUser();

  await db
    .delete(jobApplications)
    .where(
      and(eq(jobApplications.id, id), eq(jobApplications.userId, user.id))
    );

  revalidatePath("/applications");
}
