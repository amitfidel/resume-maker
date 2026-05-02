import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import { buildParseResumePrompt } from "@/lib/ai/prompts/parse-resume";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";

// Zod schema is the authoritative structure. Using generateObject
// forces the model to emit data matching this exact shape — no
// JSON.parse, no code-fence stripping, no shape drift. Keep this
// in sync with `ParsedResume` in src/app/(dashboard)/import/actions.ts.
const ParsedResumeSchema = z.object({
  fullName: z.string(),
  headline: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  githubUrl: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  summary: z.string().nullable(),
  workExperiences: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      location: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      isCurrent: z.boolean(),
      bullets: z.array(z.string()),
      // Which section the entry belongs to in the original resume.
      // Lets the profile UI render Work / Military / Volunteering
      // as distinct sections even though they live in one table.
      //
      // Required (no .default) because Groq's structured-output mode
      // requires every property to appear in the schema's `required`
      // array. The prompt instructs the model to set this explicitly,
      // and the save action defensively coerces unknown values to
      // "work".
      category: z.enum(["work", "military", "volunteer"]),
    }),
  ),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      fieldOfStudy: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      gpa: z.string().nullable(),
    }),
  ),
  skills: z.array(
    z.object({
      name: z.string(),
      category: z.string().nullable(),
    }),
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string().nullable(),
      technologies: z.array(z.string()),
      bullets: z.array(z.string()),
    }),
  ),
  certifications: z.array(
    z.object({
      name: z.string(),
      issuer: z.string().nullable(),
      issueDate: z.string().nullable(),
    }),
  ),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let resumeText = "";

  if (contentType.includes("multipart/form-data")) {
    // PDF file upload
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from the PDF. Two layers of pdf-parse weirdness here:
    //
    // 1. We pin to 1.1.1 because 2.x bundles a newer pdfjs that needs
    //    browser globals (DOMMatrix, Path2D) Node doesn't expose.
    //
    // 2. The 1.1.1 root index.js has a "debug self-test" that runs on
    //    `require("pdf-parse")` and tries to read a bundled test
    //    fixture from `./test/data/05-versions-space.pdf`. In a
    //    production build that file isn't there, so every real call
    //    blows up with ENOENT before our buffer ever reaches the
    //    parser. Workaround is to require the library file directly,
    //    bypassing the broken index. This is the documented fix on the
    //    package's GitHub issues.
    try {
      // Dynamic import to avoid bundling issues
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
        buf: Buffer,
      ) => Promise<{ text: string }>;
      const parsed = await pdfParse(buffer);
      resumeText = parsed.text;
    } catch (err) {
      log.error("pdf_parse_failed", {
        userId: user.id,
        fileName: file.name,
        size: buffer.length,
        err,
      });
      return Response.json(
        {
          error:
            "Couldn't read that PDF. Some PDFs (scanned images, encrypted, or with embedded forms) need OCR — try copying the text and pasting instead.",
        },
        { status: 422 },
      );
    }
  } else {
    // Plain text paste
    const body = await req.json();
    resumeText = body.text;
  }

  if (!resumeText.trim()) {
    return Response.json({ error: "No text to parse" }, { status: 400 });
  }

  try {
    const { system, prompt } = buildParseResumePrompt(resumeText);

    // openai/gpt-oss-120b is much stronger at structured JSON output
    // than llama-3.3-70b-versatile on Groq. Override with GROQ_MODEL.
    const { object: parsed } = await generateObject({
      model: groq(process.env.GROQ_MODEL || "openai/gpt-oss-120b"),
      schema: ParsedResumeSchema,
      system,
      prompt,
    });

    return Response.json({ data: parsed });
  } catch (error) {
    log.error("resume_parse_failed", {
      userId: user.id,
      textLength: resumeText.length,
      err: error,
    });
    return Response.json(
      { error: "AI couldn't parse the extracted text. Try again or paste plain text." },
      { status: 500 },
    );
  }
}
