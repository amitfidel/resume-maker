import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { buildJobAnalysisPrompt } from "@/lib/ai/prompts/job-tailoring";
import { resolveResume } from "@/lib/resume/resolve";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { ResolvedExperience, ResolvedSkill } from "@/lib/resume/types";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { resumeId, jobDescription } = await req.json();

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

  // Serialize resume to text for the prompt
  const sections: string[] = [];
  sections.push(`Name: ${resolved.header.fullName}`);
  if (resolved.header.headline)
    sections.push(`Headline: ${resolved.header.headline}`);
  if (resolved.summary) sections.push(`Summary: ${resolved.summary}`);

  for (const block of resolved.blocks.filter((b) => b.isVisible)) {
    if (block.type === "summary") continue;
    sections.push(`\n--- ${block.heading} ---`);
    for (const item of block.items.filter((i) => i.isVisible)) {
      if (block.type === "experience") {
        const exp = item.data as ResolvedExperience;
        sections.push(`${exp.title} at ${exp.company}`);
        for (const b of exp.bullets.filter((b) => b.visible)) {
          sections.push(`  - ${b.text}`);
        }
      } else if (block.type === "skills") {
        const skill = item.data as ResolvedSkill;
        sections.push(`  ${skill.name} (${skill.category})`);
      }
    }
  }

  try {
    const { system, prompt } = buildJobAnalysisPrompt(
      sections.join("\n"),
      jobDescription
    );

    const { text: result } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system,
      prompt,
    });

    let cleaned = result.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const analysis = JSON.parse(cleaned);
    return Response.json({ data: analysis });
  } catch (error) {
    console.error("Job tailoring error:", error);
    return Response.json(
      { error: "Failed to analyze job description" },
      { status: 500 }
    );
  }
}
