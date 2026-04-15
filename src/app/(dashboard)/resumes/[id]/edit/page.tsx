import { requireUser } from "@/lib/auth";
import { resolveResume } from "@/lib/resume/resolve";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { EditorShell } from "@/components/editor/editor-shell";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ResumeEditorPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, id), eq(resumes.userId, user.id)),
  });

  if (!resume) notFound();

  const resolved = await resolveResume(id);
  if (!resolved) notFound();

  return <EditorShell resume={resolved} />;
}
