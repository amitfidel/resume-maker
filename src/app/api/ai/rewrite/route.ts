import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { buildInlineRewritePrompt } from "@/lib/ai/prompts/inline-rewrite";
import type { InlineRewriteAction } from "@/lib/ai/prompts/inline-rewrite";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { text, action, customInstruction, jobTitle, company, targetRole } =
    await req.json();

  const { system, prompt } = buildInlineRewritePrompt({
    text,
    action: action as InlineRewriteAction,
    customInstruction,
    jobTitle,
    company,
    targetRole,
  });

  const { text: result } = await generateText({
    model: google("gemini-2.0-flash"),
    system,
    prompt,
  });

  return Response.json({ result: result.trim() });
}
