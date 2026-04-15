export type InlineRewriteAction =
  | "improve"
  | "concise"
  | "metrics"
  | "stronger"
  | "custom";

const ACTION_INSTRUCTIONS: Record<string, string> = {
  improve:
    "Improve this text to be more impactful and professional. Use strong action verbs. Make it clear and specific.",
  concise:
    "Make this text more concise while keeping the key impact. Remove filler words. Aim for under 100 characters if possible.",
  metrics:
    "Add quantified metrics or results where plausible. If the original doesn't have numbers, suggest realistic-sounding metrics based on the context. Do NOT fabricate specific company names or role titles.",
  stronger:
    "Strengthen the language to be more assertive and results-oriented. Replace passive voice with active. Lead with the impact.",
};

export function buildInlineRewritePrompt({
  text,
  action,
  customInstruction,
  jobTitle,
  company,
  targetRole,
}: {
  text: string;
  action: InlineRewriteAction;
  customInstruction?: string;
  jobTitle?: string;
  company?: string;
  targetRole?: string;
}): { system: string; prompt: string } {
  const instruction =
    action === "custom"
      ? customInstruction ?? "Improve this text."
      : ACTION_INSTRUCTIONS[action];

  const context = [
    jobTitle && `Current role: ${jobTitle}`,
    company && `Company: ${company}`,
    targetRole && `Targeting role: ${targetRole}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    system: `You are an expert resume writer. You help improve resume bullet points and text.

Rules:
- Return ONLY the rewritten text, nothing else. No quotes, no explanation, no preamble.
- Do NOT invent specific metrics, company names, or job titles that weren't in the original.
- Keep the same general meaning and scope.
- Use professional, clear language.
- Use strong action verbs (Led, Built, Designed, Increased, Reduced, etc.)`,

    prompt: `${context ? `Context:\n${context}\n\n` : ""}Instruction: ${instruction}

Original text:
${text}

Rewritten text:`,
  };
}
