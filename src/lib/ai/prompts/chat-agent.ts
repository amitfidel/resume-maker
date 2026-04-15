import type { ResolvedResume } from "@/lib/resume/types";
import type { ResolvedExperience, ResolvedSkill, ResolvedEducation } from "@/lib/resume/types";

export function buildChatAgentPrompt(resume: ResolvedResume): string {
  const resumeSnapshot = serializeResumeForAgent(resume);

  return `You are an AI resume assistant helping the user improve their resume through conversation.

You have access to tools that modify the resume. Use them when the user asks for changes.

## Current Resume State

${resumeSnapshot}

## Guidelines

1. **Ask clarifying questions first** when the request is ambiguous.
   - Example: If user says "make my experience better", ask which experience and what specifically.
   - Example: If user says "add more metrics", ask to which bullet.

2. **Be concise** - resume changes should be focused and impactful.

3. **When making changes:**
   - Use strong action verbs (Led, Built, Designed, Increased, Reduced)
   - Keep bullets under 120 characters when possible
   - NEVER invent metrics, company names, or experiences not mentioned by the user
   - Preserve the user's voice and accuracy

4. **Confirm after making changes** - briefly explain what you changed and why.

5. **Multiple changes**: If the user requests multiple changes, use multiple tool calls in sequence.

6. **Reference IDs correctly**: The resume above has unique IDs for each bullet, block, and item. Use those exact IDs when calling tools.

## Tone
Be professional, direct, and helpful. Act like a senior resume coach - not a chatbot.`;
}

function serializeResumeForAgent(resume: ResolvedResume): string {
  const lines: string[] = [];

  lines.push(`Title: ${resume.title}`);
  lines.push(`Name: ${resume.header.fullName}`);
  if (resume.header.headline) lines.push(`Headline: ${resume.header.headline}`);
  if (resume.summary) lines.push(`\nSummary: ${resume.summary}`);
  lines.push("");

  for (const block of resume.blocks) {
    const visibility = block.isVisible ? "" : " [HIDDEN]";
    lines.push(`\n## BLOCK ${block.id} - ${block.heading}${visibility}`);
    lines.push(`  type: ${block.type}`);

    for (const item of block.items) {
      const itemVis = item.isVisible ? "" : " [HIDDEN]";
      lines.push(`\n  ### ITEM ${item.id}${itemVis}`);

      if (block.type === "experience") {
        const exp = item.data as ResolvedExperience;
        lines.push(`    ${exp.title} at ${exp.company}`);
        for (const b of exp.bullets) {
          const bv = b.visible ? "" : " [HIDDEN]";
          lines.push(`      BULLET ${b.id}: ${b.text}${bv}`);
        }
      } else if (block.type === "skills") {
        const skill = item.data as ResolvedSkill;
        lines.push(`    ${skill.name} (${skill.category})`);
      } else if (block.type === "education") {
        const edu = item.data as ResolvedEducation;
        lines.push(`    ${edu.degree} at ${edu.institution}`);
      }
    }
  }

  return lines.join("\n");
}
