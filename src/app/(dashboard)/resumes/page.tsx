import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ResumesView } from "./resumes-view";

export default async function ResumesPage() {
  const user = await requireUser();

  const userResumes = await db.query.resumes.findMany({
    where: eq(resumes.userId, user.id),
    orderBy: (r, { desc }) => [desc(r.updatedAt)],
  });

  const firstName =
    ((user.user_metadata?.full_name as string | undefined) ?? "").split(" ")[0];

  return (
    <ResumesView
      firstName={firstName}
      resumes={userResumes.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        updatedAt: r.updatedAt,
      }))}
    />
  );
}
