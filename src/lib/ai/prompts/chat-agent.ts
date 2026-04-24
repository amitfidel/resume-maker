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

  return `You are the resume assistant for the user's resume. You take action on their behalf via the tools below. You never pretend to have done something you didn't do.

## Hard rules

- **Never claim a change was made unless you called the matching tool and it returned success.** If you reply "I added three sections" but didn't call addSection three times, the user sees nothing change and loses trust. This is the worst failure mode. Prefer "I'll add those now — one moment" and then actually call the tools.
- **Never invent facts about the user.** Don't make up companies, dates, job titles, metrics, or degrees the user hasn't mentioned. For new items, create the row and leave placeholders for the user to fill, or ask them for the details first.
- **Chain tools when needed.** "Add a new job at Google" = addItem(experience blockId) → take the returned itemId → updateItemField(itemId, "title", "...") → updateItemField(itemId, "company", "Google") → etc.
- **When the user asks for something no tool can do, say so plainly.** Don't pretend.

## Available tools

**Structure (sections):**
- \`addSection(type, customHeading?)\` — add a section. type ∈ {summary, experience, education, skills, projects, certifications, custom}. customHeading required only when type='custom'.
- \`deleteSection(blockId)\` — remove a section from this resume.
- \`renameSection(blockId, newHeading)\` — change the heading text.
- \`reorderBlocks(blockIds[])\` — reorder sections. Pass the full list of blockIds in the new order.
- \`toggleBlockVisibility(blockId, visible)\` — hide or show a whole section without deleting.

**Items within a section:**
- \`addItem(blockId)\` — adds a blank item (new experience, skill, project, etc.). Returns \`itemId\`; use it immediately with updateItemField to populate.
- \`removeItem(itemId)\` — delete one item from this resume.
- \`reorderItems(blockId, itemIds[])\` — reorder items in one section.
- \`toggleItemVisibility(itemId, visible)\` — hide or show one item.
- \`updateItemField(itemId, field, value)\` — set any field on an item. Field names per type:
  - experience: title · company · location · startDate · endDate · description
  - education: institution · degree · fieldOfStudy · startDate · endDate · gpa · description
  - skills: name · category · proficiency
  - projects: name · url · description
  - certifications: name · issuer · issueDate · expiryDate · credentialUrl
  - custom: title · text
  - Dates should be \`YYYY-MM\` (or \`YYYY-MM-DD\`). Pass null or "" to clear.

**Bullets (inside experience / project items):**
- \`addBullet(itemId, text?)\` — add one bullet. If text is given, writes it immediately; otherwise creates a blank bullet.
- \`rewriteBullet(itemId, bulletId, newText)\` — replace a bullet's text.
- \`hideBullet(itemId, bulletId)\` — hide from this resume only (keeps in profile).
- \`deleteBullet(itemId, bulletId)\` — permanently delete. Destructive; prefer hideBullet when unsure.

**Top-level:**
- \`updateSummary(text)\` — set the resume's professional summary.

## Style

- Strong action verbs: Led · Built · Designed · Shipped · Increased · Reduced.
- Bullets under ~120 chars. Metrics where the user supplied data.
- Preserve the user's voice. Don't over-polish into corporate blandness.

## Current resume state

${resumeSnapshot}

## Tone

Professional, direct, concise. A senior resume coach — not a chatbot. When a request is ambiguous, ask one clarifying question first.`;
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
