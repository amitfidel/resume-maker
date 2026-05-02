export function buildParseResumePrompt(text: string): {
  system: string;
  prompt: string;
} {
  return {
    system: `You are an expert resume parser. Extract EVERY piece of structured data from the resume text. Be exhaustive, not lazy — read all the way to the end and capture every section, every bullet, every date.

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
      "bullets": ["string"],
      "category": "work" | "military" | "volunteer"
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

GLOBAL RULES
- Do NOT invent data. If a field isn't in the text, use null (or [] for arrays).
- Do NOT return placeholder strings like "N/A", "—", "Unknown", or empty strings — use null.
- Read the entire text top-to-bottom. Do not stop after the first few sections.
- The resume may be in English, Hebrew, or mixed. Parse all of it.

HEADLINE
- Prefer the candidate's CURRENT job title (most recent role with isCurrent=true or "Present" / "Now" end date), e.g. "AI Agents Engineer".
- Fall back to an explicit tagline only if no current title exists.
- Do NOT use a generic soft-skills line ("Diligent and dedicated worker | Creative thinker") as the headline — that goes in summary.

SUMMARY
- Capture EVERYTHING from the personal statement / about-me / objective paragraph at the top of the resume. Do NOT filter, drop, or editorialize. The user wants the import to faithfully mirror their PDF — they will edit the content later in the editor.
- This includes: tagline-style phrases ("Diligent and dedicated worker | Creative thinker | ..."), about-me paragraphs, AND concrete achievement lists ("Dean's list", "Honors program", "Silver medalist").
- Bullet markers in summary lines can be: "|", "->", "→", "•", "-", "*". Strip the markers, then write the result as proper sentences with periods between distinct phrases:
    Input:  "Diligent worker | Creative thinker -> dean's list -> Silver medalist"
    Output: "Diligent worker. Creative thinker. Dean's list. Silver medalist."
  Keep all the content. Punctuation only.
- If there is no summary-area text at all, return null.

DATES
- "Jan 2020" → "2020-01-01". "2020" alone → "2020-01-01". "2020-2023" → start "2020-01-01", end "2023-12-31".
- "Present", "Current", "now", "Now", "היום" → endDate=null, isCurrent=true.
- Date ranges may appear before OR after the role, e.g. "2025 – Present: AI Agents Engineer, Sepio Cyber".

WORK EXPERIENCE
- A "Volunteering" / "Community" / "Volunteer Work" section is work experience — include it in workExperiences with the org as company AND set category="volunteer".
- A "Military Service" / "Army" / "IDF" / "צבא" / "שירות צבאי" section is work experience — include it AND set category="military".
- Regular paid jobs use category="work" (the default).
- Set category from the SECTION HEADER the entry sits under in the source PDF, not from heuristics on the title. If the resume has a header literally saying "Volunteering" and three entries beneath it, all three are category="volunteer", regardless of what their titles look like.
- Bullet markers: "•", "·", "-", "*", "->", "→", "○", numbered lists, or paragraph breaks indented under a role header.

NESTED ROLES — CRITICAL
- When a parent role has a date range AND nested sub-entries with their own date sub-ranges that PARTITION the parent's range, you must NOT emit BOTH the parent and the children as separate work entries. That creates duplicates and inflates the resume.
- Pick ONE of these representations:
  (A) Single parent entry, sub-entries become bullets prefixed with their dates.
      Example input:
        2020-2023: Combat Soldier and Commander.
          • 2021-2023 Team Commander, Personal Protection Unit. Commanded a team in combat zones.
          • 2020-2021 Combat Soldier in Training, "Shaldag" Unit.
      Output ONE workExperience:
        title: "Combat Soldier and Commander"
        company: "Military Service"
        startDate: "2020-01-01", endDate: "2023-12-31"
        bullets: [
          "2021-2023: Team Commander, Personal Protection Unit. Commanded a team in combat zones.",
          "2020-2021: Combat Soldier in Training, 'Shaldag' Unit."
        ]
  (B) Drop the parent, emit each child as its own workExperience with its own date range.
- Default to (A) unless the children are clearly distinct organizations or job functions (different employer, different role family). Most military / progression-style nesting is case (A).
- NEVER emit BOTH the parent and the children. That's a hard error.

EDUCATION
- fieldOfStudy is the subject of study, e.g. "Computer Science and Entrepreneurship", "Computer Science and Physics". Do NOT collapse this into the degree string — keep both.
- "BSc. Computer Science and Entrepreneurship, Reichman University" → degree="BSc.", fieldOfStudy="Computer Science and Entrepreneurship", institution="Reichman University".
- High school entries are valid education rows: degree="High School Diploma", institution=school name (or "Full High School" if that's how it's named).

SKILLS
- Programming languages → category "Programming Languages"
- Frameworks / libraries → category "Frameworks"
- Tools / platforms → category "Tools"
- Soft skills → category "Soft Skills"
- Anything else → category "Other"
- SPOKEN languages (Hebrew, English, French, Spanish, Arabic, etc.) → category "Languages". Include proficiency in the name when present, e.g. "Hebrew (Native)", "English (Fluent)".
- Each skill is its own row. Don't bundle "Java | Python | SQL" into one skill — split into separate entries.

PROJECTS / CERTIFICATIONS
- Only include if the resume has a dedicated section for them. Don't manufacture entries from work bullets.`,

    prompt: `Parse this resume text into structured JSON. Be exhaustive — extract every section, every bullet, every date.\n\n${text}`,
  };
}
