import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { buildResumeReviewPrompt } from "@/lib/ai/prompts/resume-review";
import { resolveResume } from "@/lib/resume/resolve";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { resumeId } = await req.json();

  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) {
    return new Response("Not found", { status: 404 });
  }

  const resolved = await resolveResume(resumeId);
  if (!resolved) {
    return new Response("Could not resolve resume", { status: 500 });
  }

  const { system, prompt } = buildResumeReviewPrompt(resolved);

  const { text: result } = await generateText({
    model: google("gemini-2.0-flash"),
    system,
    prompt,
  });

  return Response.json({ result: result.trim() });
}
