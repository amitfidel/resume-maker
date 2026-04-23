import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { buildParseResumePrompt } from "@/lib/ai/prompts/parse-resume";
import { createClient } from "@/lib/supabase/server";

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

    // Dynamic import to avoid bundling issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
    const parsed = await pdfParse(buffer);
    resumeText = parsed.text;
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

    const { text: result } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system,
      prompt,
    });

    // Clean up the response - strip code fences if present
    let cleaned = result.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(cleaned);
    return Response.json({ data: parsed });
  } catch (error) {
    console.error("Resume parse error:", error);
    return Response.json(
      { error: "Failed to parse resume" },
      { status: 500 }
    );
  }
}
