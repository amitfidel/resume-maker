import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { coverLetters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { resolveResume } from "@/lib/resume/resolve";
import { renderCoverLetterToDocx } from "@/lib/export/cover-letter-docx";
import { log } from "@/lib/log";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const cl = await db.query.coverLetters.findFirst({
    where: and(eq(coverLetters.id, id), eq(coverLetters.userId, user.id)),
  });
  if (!cl) return new Response("Not found", { status: 404 });

  // Pull the candidate's identity off the parent resume so the letter
  // can sign itself correctly.
  const resume = await resolveResume(cl.resumeId);
  if (!resume) return new Response("Could not resolve resume", { status: 500 });

  try {
    const buffer = await renderCoverLetterToDocx({
      cl,
      senderName: resume.header.fullName || "",
      senderEmail: resume.header.email,
      senderPhone: resume.header.phone,
    });
    const filename = `${(cl.title || "Cover Letter").replace(/[^a-zA-Z0-9-_ ]/g, "")}.docx`;
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    log.error("cover_letter_docx_failed", { coverLetterId: id, err });
    return new Response("Failed to generate DOCX", { status: 500 });
  }
}
