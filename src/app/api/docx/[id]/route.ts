import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { resolveResume } from "@/lib/resume/resolve";
import { renderResumeToDocx } from "@/lib/export/docx";
import { log } from "@/lib/log";

/**
 * DOCX export. Mirrors the PDF route in shape (auth → ownership →
 * resolve → render → stream back) but skips Puppeteer entirely:
 * `docx` is a pure-Node library, much cheaper to run than a headless
 * browser. ATS-friendly fallback for sites that reject PDF uploads.
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

  try {
    const buffer = await renderResumeToDocx(resolved);

    const filename = `${resume.title.replace(/[^a-zA-Z0-9-_ ]/g, "")}.docx`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    log.error("docx_export_failed", { resumeId: id, err });
    return new Response("Failed to generate DOCX", { status: 500 });
  }
}
