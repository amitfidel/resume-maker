import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
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
    model: groq("llama-3.3-70b-versatile"),
    system,
    prompt,
  });

  return Response.json({ result: result.trim() });
}
