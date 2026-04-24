import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { resumes, jobApplications, careerProfiles } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { DashboardView } from "./dashboard-view";

export default async function DashboardPage() {
  const user = await requireUser();

  const [resumeCount] = await db
    .select({ count: count() })
    .from(resumes)
    .where(eq(resumes.userId, user.id));

  const [applicationCount] = await db
    .select({ count: count() })
    .from(jobApplications)
    .where(eq(jobApplications.userId, user.id));

  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });

  const recentResumes = await db.query.resumes.findMany({
    where: eq(resumes.userId, user.id),
    orderBy: [desc(resumes.updatedAt)],
    limit: 4,
  });

  const hasProfile = !!(profile?.headline || profile?.summary);
  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "";

  return (
    <DashboardView
      firstName={firstName}
      resumeCount={resumeCount.count}
      applicationCount={applicationCount.count}
      hasProfile={hasProfile}
      recentResumes={recentResumes.map((r) => ({
        id: r.id,
        title: r.title,
        updatedAt: r.updatedAt,
      }))}
    />
  );
}
