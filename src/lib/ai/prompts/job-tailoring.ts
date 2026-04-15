export function buildJobAnalysisPrompt(
  resumeText: string,
  jobDescription: string
): { system: string; prompt: string } {
  return {
    system: `You are a resume tailoring expert. Analyze a job description against a resume and provide actionable suggestions.
Return ONLY valid JSON. No explanation, no markdown fences.

Schema:
{
  "matchScore": 0-100,
  "keywordMatches": ["keyword that appears in both JD and resume"],
  "missingKeywords": ["keyword in JD but NOT in resume"],
  "suggestions": [
    {
      "section": "summary | experience | skills | education",
      "type": "rewrite | add | emphasize | reorder",
      "original": "original text or null",
      "suggested": "suggested replacement or addition",
      "reason": "why this change helps"
    }
  ],
  "overallFeedback": "2-3 sentence summary of how well the resume matches and top priority changes"
}

Rules:
- Be specific with suggestions - reference actual text from the resume
- Limit to 5-8 most impactful suggestions
- Do NOT suggest inventing false experience or metrics
- Focus on keyword alignment, emphasis shifting, and language matching`,

    prompt: `Analyze this resume against the job description and suggest tailoring changes.

=== RESUME ===
${resumeText}

=== JOB DESCRIPTION ===
${jobDescription}`,
  };
}
