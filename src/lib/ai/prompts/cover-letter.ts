import type { ResolvedResume } from "@/lib/resume/types";
import type {
  ResolvedExperience,
  ResolvedBlockItem,
  ResolvedSkill,
} from "@/lib/resume/types";

/**
 * System prompt for cover-letter generation. The agent is constrained
 * tighter than the editor chat: no tools, no agency — just write a
 * focused 3–4 paragraph letter. The user's resume + the job
 * description go in as context; the model gets the user's tone via
 * the resume's existing summary if there is one.
 */
export function buildCoverLetterPrompt(opts: {
  resume: ResolvedResume;
  jobDescription: string | null;
  recipientName: string | null;
  recipientCompany: string | null;
  tone: "formal" | "direct" | "warm";
}): string {
  const { resume, jobDescription, recipientName, recipientCompany, tone } = opts;
  const compact = compactResume(resume);

  const toneInstruction = {
    formal:
      "Use a formal register. Full sentences, no contractions, no exclamation marks.",
    direct:
      "Direct and concise. Strong verbs, short sentences, lead with the most relevant point.",
    warm:
      "Warm and human. Show personality without being casual; contractions are fine.",
  }[tone];

  return `You write a cover letter for the candidate below. The output is the letter body only — no greeting line if a recipient name is given (the UI handles that), no sign-off, no JSON, no markdown formatting, no commentary. Plain text with paragraph breaks (double newlines).

LANGUAGE: Match the language of the candidate's resume summary and recent bullets. If the resume is in Hebrew, write in Hebrew. If English, write in English.

LENGTH: 3 paragraphs, ~250 words total. The first paragraph names the role and one specific reason the candidate is a fit. The second paragraph picks ONE relevant project/experience from the resume and shows impact (numbers, scale, outcome). The third paragraph closes with intent and a one-line call to action.

VOICE: ${toneInstruction}

CONSTRAINTS:
- Do not invent achievements. Use only what's in the resume context below.
- Do not list skills as a comma-separated dump.
- Do not start with "I am writing to apply".
- Avoid clichés: "passionate", "team player", "go-getter", "results-driven", "thinking outside the box".
- If the job description mentions a specific stack/skill the candidate has, name it.

CONTEXT — the candidate's resume:
${compact}

CONTEXT — the job:
${
  jobDescription?.trim()
    ? jobDescription.trim()
    : "(no job description provided — write a generic letter that highlights the candidate's strongest experience)"
}

CONTEXT — recipient:
${recipientName ? `Recipient name: ${recipientName}` : "(no specific recipient)"}
${recipientCompany ? `Company: ${recipientCompany}` : ""}`;
}

/**
 * Compact resume summary for the AI prompt — much smaller than the
 * full chat-agent serialization since the cover letter doesn't need
 * IDs or override metadata.
 */
function compactResume(resume: ResolvedResume): string {
  const lines: string[] = [];
  lines.push(`Name: ${resume.header.fullName || "(unknown)"}`);
  if (resume.header.headline) lines.push(`Headline: ${resume.header.headline}`);
  if (resume.summary) lines.push(`Summary: ${resume.summary}`);
  lines.push("");

  for (const block of resume.blocks) {
    if (!block.isVisible) continue;
    if (block.type === "experience") {
      lines.push("Experience:");
      for (const item of block.items) {
        if (!item.isVisible) continue;
        const e = (item as ResolvedBlockItem<ResolvedExperience>).data;
        const title = e.title || "(untitled)";
        const company = e.company || "(no company)";
        const dates = `${e.startDate ?? ""}${e.endDate ? `–${e.endDate}` : (e.isCurrent ? "–present" : "")}`;
        lines.push(`  • ${title} at ${company} (${dates})`);
        for (const b of e.bullets) {
          if (b.visible && b.text.trim()) lines.push(`    - ${b.text}`);
        }
      }
    } else if (block.type === "skills") {
      const skills = block.items
        .filter((i) => i.isVisible)
        .map((i) => (i as ResolvedBlockItem<ResolvedSkill>).data.name)
        .filter(Boolean);
      if (skills.length) lines.push(`Skills: ${skills.join(", ")}`);
    } else if (block.type === "projects") {
      // Keep this short — just project names + 1 bullet each is enough
      // signal for the model.
      const projects = block.items
        .filter((i) => i.isVisible)
        .map((i) => {
          const p = i.data as { name?: string; description?: string };
          return p.name ? `${p.name}${p.description ? ` — ${p.description}` : ""}` : "";
        })
        .filter(Boolean);
      if (projects.length) lines.push(`Projects: ${projects.join("; ")}`);
    }
  }
  return lines.join("\n");
}
