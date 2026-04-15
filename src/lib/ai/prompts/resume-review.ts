import type { ResolvedResume } from "@/lib/resume/types";
import type { ResolvedExperience, ResolvedSkill } from "@/lib/resume/types";

export function buildResumeReviewPrompt(resume: ResolvedResume): {
  system: string;
  prompt: string;
} {
  // Serialize the resume into a readable format for the AI
  const sections: string[] = [];

  sections.push(`Name: ${resume.header.fullName}`);
  if (resume.header.headline)
    sections.push(`Headline: ${resume.header.headline}`);
  if (resume.summary) sections.push(`\nSummary:\n${resume.summary}`);

  for (const block of resume.blocks.filter((b) => b.isVisible)) {
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
      } else {
        sections.push(`  ${JSON.stringify(item.data)}`);
      }
    }
  }

  const resumeText = sections.join("\n");

  return {
    system: `You are an expert resume reviewer and career coach. You provide specific, actionable feedback.

Rules:
- Be direct and specific. Reference actual content from the resume.
- Organize feedback into clear categories.
- Prioritize the most impactful improvements first.
- Do NOT suggest adding false information.
- Keep your response under 500 words.`,

    prompt: `Review this resume and provide specific feedback:

${resumeText}

${resume.targetJobTitle ? `Target role: ${resume.targetJobTitle}` : ""}
${resume.targetCompany ? `Target company: ${resume.targetCompany}` : ""}

Provide feedback in this format:

**Strengths**
- (2-3 specific strengths)

**Improvements**
- (3-5 specific, actionable improvements with examples)

**Missing Elements**
- (anything important that's missing for this type of resume)`,
  };
}
