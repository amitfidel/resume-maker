import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { resolveResume } from "@/lib/resume/resolve";
import { renderResumeToText } from "@/lib/export/docx";

/**
 * Plain-text export. The most parser-friendly format possible — every
 * ATS will read it. Useful when an application portal asks you to
 * paste your resume into a textarea instead of uploading a file.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, id), eq(resumes.userId, user.id)),
  });
  if (!resume) {
    return new Response("Not found", { status: 404 });
  }

  const resolved = await resolveResume(id);
  if (!resolved) {
    return new Response("Could not resolve resume", { status: 500 });
  }

  const text = renderResumeToText(resolved);
  const filename = `${resume.title.replace(/[^a-zA-Z0-9-_ ]/g, "")}.txt`;

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
