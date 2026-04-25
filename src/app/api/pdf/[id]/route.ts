import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  // Forward the user's UI locale (set in localStorage on the client) into
  // the headless render — Puppeteer can't see localStorage.
  const locale = url.searchParams.get("locale") === "he" ? "he" : "en";

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify ownership
  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, id), eq(resumes.userId, user.id)),
  });
  if (!resume) {
    return new Response("Not found", { status: 404 });
  }

  try {
    // Dynamic import to avoid bundling Puppeteer in client
    const puppeteer = await import("puppeteer");

    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Get the origin from headers
    const headersList = await headers();
    const host = headersList.get("host") ?? "localhost:3001";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const renderUrl = `${protocol}://${host}/resume-render/${id}?locale=${locale}`;

    await page.goto(renderUrl, { waitUntil: "networkidle0", timeout: 30000 });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    await browser.close();

    const filename = `${resume.title.replace(/[^a-zA-Z0-9-_ ]/g, "")}.pdf`;

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response("Failed to generate PDF", { status: 500 });
  }
}
