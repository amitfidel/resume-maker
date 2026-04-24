import type { ResolvedResume } from "@/lib/resume/types";
import type {
  ResolvedExperience,
  ResolvedSkill,
  ResolvedEducation,
  ResolvedProject,
  ResolvedCertification,
  ResolvedCustomItem,
} from "@/lib/resume/types";

export function buildChatAgentPrompt(resume: ResolvedResume): string {
  const resumeSnapshot = serializeResumeForAgent(resume);

  return `You are the user's resume assistant. You edit their resume through the tools provided — you do NOT edit through text responses alone.

CRITICAL: Never claim you made a change unless you called the matching tool and got success back. If you say "I added sections" without calling addSection, the user sees nothing change. If a tool doesn't exist for the request, say so plainly.

Never invent details (companies, dates, titles, metrics). For new items with unknown details, add empty items and tell the user what to fill in — or ask them first.

Chain tools when needed. Example: "Add a new job at Google" → call addItem to get itemId → updateItemField(itemId, "title", "...") → updateItemField(itemId, "company", "Google").

Style: strong action verbs (Led, Built, Shipped, Increased). Bullets under 120 chars. Preserve the user's voice.

## Current resume

${resumeSnapshot}`;
}

function serializeResumeForAgent(resume: ResolvedResume): string {
  const lines: string[] = [];

  lines.push(`Title: ${resume.title}`);
  lines.push(`Name: ${resume.header.fullName || "(not set)"}`);
  if (resume.header.headline) lines.push(`Headline: ${resume.header.headline}`);
  if (resume.summary) lines.push(`\nSummary: ${resume.summary}`);
  lines.push("");

  if (resume.blocks.length === 0) {
    lines.push("(no sections yet — resume is empty)");
    return lines.join("\n");
  }

  for (const block of resume.blocks) {
    const visibility = block.isVisible ? "" : " [HIDDEN]";
    lines.push(`\n## BLOCK ${block.id} — ${block.heading} (type=${block.type})${visibility}`);

    if (block.items.length === 0) {
      lines.push("  (no items yet — use addItem to add one)");
      continue;
    }

    for (const item of block.items) {
      const itemVis = item.isVisible ? "" : " [HIDDEN]";
      lines.push(`\n  ### ITEM ${item.id}${itemVis}`);

      if (block.type === "experience") {
        const exp = item.data as ResolvedExperience;
        lines.push(
          `    ${exp.title || "(no title)"} at ${exp.company || "(no company)"} (${exp.startDate || "?"} → ${exp.isCurrent ? "present" : exp.endDate || "?"})`,
        );
        for (const b of exp.bullets) {
          const bv = b.visible ? "" : " [HIDDEN]";
          lines.push(`      BULLET ${b.id}: ${b.text}${bv}`);
        }
      } else if (block.type === "skills") {
        const skill = item.data as ResolvedSkill;
        lines.push(
          `    ${skill.name || "(no name)"}${skill.category ? ` — ${skill.category}` : ""}${skill.proficiency ? ` (${skill.proficiency})` : ""}`,
        );
      } else if (block.type === "education") {
        const edu = item.data as ResolvedEducation;
        lines.push(
          `    ${edu.degree || "(no degree)"}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""} at ${edu.institution || "(no institution)"}`,
        );
      } else if (block.type === "projects") {
        const proj = item.data as ResolvedProject;
        lines.push(`    ${proj.name || "(no name)"}${proj.description ? ` — ${proj.description}` : ""}`);
        for (const b of proj.bullets) {
          const bv = b.visible ? "" : " [HIDDEN]";
          lines.push(`      BULLET ${b.id}: ${b.text}${bv}`);
        }
      } else if (block.type === "certifications") {
        const cert = item.data as ResolvedCertification;
        lines.push(`    ${cert.name || "(no name)"}${cert.issuer ? ` — ${cert.issuer}` : ""}`);
      } else if (block.type === "custom") {
        const cu = item.data as ResolvedCustomItem;
        lines.push(`    ${cu.title || "(no title)"}${cu.text ? `: ${cu.text}` : ""}`);
      }
    }
  }

  return lines.join("\n");
}
