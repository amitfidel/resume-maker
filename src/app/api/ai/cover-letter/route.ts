import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";
import { resolveResume } from "@/lib/resume/resolve";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/ai/rate-limit";
import { buildCoverLetterPrompt } from "@/lib/ai/prompts/cover-letter";
import { db } from "@/db";
import { coverLetters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { log } from "@/lib/log";

// A cover letter generation is heavier than a chat turn (more output
// tokens) so the request body is smaller and we apply the same per-
// user rate limit as /api/ai/chat — they share a budget.
const MAX_BODY_BYTES = 32 * 1024;
const MAX_JD_CHARS = 16_000;

/**
 * Generates a cover letter as a streaming plain-text response. The
 * body is whatever the model emits (3–4 paragraphs, plain text). The
 * client appends deltas as they arrive and saves the final body via
 * the `saveGeneratedCoverLetter` server action.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const rl = rateLimit(`chat:${user.id}`, 10, 10 / 60);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({
        error: `Rate limit. Try again in ${rl.retryAfterSec}s.`,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rl.retryAfterSec),
        },
      },
    );
  }

  const lenHeader = req.headers.get("content-length");
  if (lenHeader && Number(lenHeader) > MAX_BODY_BYTES) {
    return new Response("Request body too large", { status: 413 });
  }

  let body: {
    coverLetterId?: unknown;
    tone?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const coverLetterId =
    typeof body.coverLetterId === "string" ? body.coverLetterId : null;
  const tone =
    body.tone === "formal" || body.tone === "direct" || body.tone === "warm"
      ? body.tone
      : "direct";

  if (!coverLetterId) {
    return new Response("coverLetterId required", { status: 400 });
  }

  // Verify ownership through the cover_letters table — same DB row
  // also gives us the resumeId, jobDescription, and recipient bits.
  const cl = await db.query.coverLetters.findFirst({
    where: and(
      eq(coverLetters.id, coverLetterId),
      eq(coverLetters.userId, user.id),
    ),
  });
  if (!cl) return new Response("Not found", { status: 404 });

  const resume = await resolveResume(cl.resumeId);
  if (!resume) {
    return new Response("Could not resolve resume", { status: 500 });
  }

  // Cap the job description in case someone pasted something huge.
  const jobDescription = (cl.jobDescription ?? "").slice(0, MAX_JD_CHARS);

  const systemPrompt = buildCoverLetterPrompt({
    resume,
    jobDescription: jobDescription || null,
    recipientName: cl.recipientName,
    recipientCompany: cl.recipientCompany,
    tone,
  });

  try {
    const result = streamText({
      model: groq(process.env.GROQ_MODEL || "openai/gpt-oss-120b"),
      system: systemPrompt,
      // No conversation — single-turn generation.
      messages: [
        {
          role: "user",
          content: "Write the cover letter now. Plain text only.",
        },
      ],
      abortSignal: req.signal,
    });

    // Stream raw text deltas. The client persists via saveGeneratedCoverLetter
    // after the stream completes; no need for NDJSON event types here.
    return result.toTextStreamResponse({
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    log.error("cover_letter_generation_failed", { coverLetterId, err });
    return new Response("Generation failed", { status: 500 });
  }
}
