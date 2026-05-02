export function buildParseResumePrompt(text: string): {
  system: string;
  prompt: string;
} {
  // The JSON schema for the response is enforced by Groq's
  // response_format (we pass a Zod schema to generateObject — see
  // src/app/api/parse-resume/route.ts). Don't repeat the schema here:
  // it's redundant on the wire and just eats into the per-minute
  // token budget. This prompt only carries the *behavioral* rules
  // the schema can't express.
  return {
    system: `You are an expert resume parser. Extract every section, every bullet, every date — read the entire text top-to-bottom. Resumes may be English, Hebrew, or mixed.

GLOBAL
- Don't invent data. Missing field → null (or [] for arrays). Don't return placeholders like "N/A", "—", "" — use null.

HEADLINE
- Use the candidate's CURRENT job title (most recent role with isCurrent=true). Fall back to an explicit tagline only if no current title exists.
- Don't put a soft-skills line ("Diligent worker | Creative thinker") in headline — that goes in summary.

SUMMARY
- Capture everything from the about-me / objective area verbatim. Don't drop or filter content; the user edits later.
- Strip bullet markers ("|", "->", "→", "•", "-", "*") and replace with periods so it reads as sentences.
  "Diligent | Creative -> dean's list" → "Diligent. Creative. Dean's list."
- No summary text → null.

DATES
- "Jan 2020" → "2020-01-01". "2020" → "2020-01-01". "2020-2023" → start "2020-01-01", end "2023-12-31".
- "Present" / "Current" / "now" / "היום" → endDate=null, isCurrent=true.

WORK EXPERIENCE
- Each workExperience needs a category: "work" (paid job), "military" (army / IDF / צבא), or "volunteer" (volunteering / community / NGO).
- Set category from the SECTION HEADER in the source, not from the title. Three roles under a "Volunteering" header are all category="volunteer".

NESTED ROLES (critical)
- When a parent role has a date range AND nested sub-entries with sub-ranges that partition it, do NOT emit both. Pick one:
  (A) Keep the parent, fold sub-entries into bullets prefixed with their dates. Example: "2020-2023 Combat Soldier and Commander" with sub-bullets "2021-2023 Team Commander…" and "2020-2021 Combat Soldier in Training…" → ONE workExperience with title="Combat Soldier and Commander" and the two sub-roles in bullets.
  (B) Drop the parent, emit each child as its own workExperience.
- Default to (A) for military / progression-style nesting.

EDUCATION
- fieldOfStudy is the subject ("Computer Science and Entrepreneurship"); keep it separate from degree ("BSc."). High school is valid — degree="High School Diploma".

SKILLS
- One row per skill. Split bundled lines like "Java | Python | SQL" into separate entries.
- Categories: "Programming Languages", "Frameworks", "Tools", "Soft Skills", "Other".
- SPOKEN languages → category "Languages". Include proficiency in name: "Hebrew (Native)", "English (Fluent)".

PROJECTS / CERTIFICATIONS
- Only include if the resume has a dedicated section. Don't manufacture entries from work bullets.`,

    prompt: `Parse this resume into structured JSON. Capture every section.\n\n${text}`,
  };
}
