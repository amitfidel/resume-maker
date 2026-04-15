export function buildParseResumePrompt(text: string): {
  system: string;
  prompt: string;
} {
  return {
    system: `You are a resume parser. Extract structured data from resume text.
Return ONLY valid JSON matching the exact schema below. No explanation, no markdown, no code fences.

Schema:
{
  "fullName": "string",
  "headline": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "linkedinUrl": "string or null",
  "githubUrl": "string or null",
  "websiteUrl": "string or null",
  "summary": "string or null",
  "workExperiences": [
    {
      "company": "string",
      "title": "string",
      "location": "string or null",
      "startDate": "YYYY-MM-DD or null",
      "endDate": "YYYY-MM-DD or null",
      "isCurrent": false,
      "bullets": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "fieldOfStudy": "string or null",
      "startDate": "YYYY-MM-DD or null",
      "endDate": "YYYY-MM-DD or null",
      "gpa": "string or null"
    }
  ],
  "skills": [
    { "name": "string", "category": "string or null" }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string or null",
      "technologies": ["string"],
      "bullets": ["string"]
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string or null",
      "issueDate": "YYYY-MM-DD or null"
    }
  ]
}

Rules:
- For dates, approximate to the first of the month if only month/year given (e.g., "Jan 2020" -> "2020-01-01")
- For skills, try to categorize into "Languages", "Frameworks", "Tools", "Other"
- Do NOT invent data that isn't in the text
- If a field is missing from the text, use null
- Return empty arrays for sections not present`,

    prompt: `Parse this resume text into structured JSON:\n\n${text}`,
  };
}
