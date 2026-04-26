import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { coverLetters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { log } from "@/lib/log";

/**
 * Cover letter PDF export. Same Puppeteer-via-render-page pattern as
 * the resume PDF route, just pointed at the cover-letter render page.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") === "he" ? "he" : "en";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const cl = await db.query.coverLetters.findFirst({
    where: and(eq(coverLetters.id, id), eq(coverLetters.userId, user.id)),
  });
  if (!cl) return new Response("Not found", { status: 404 });

  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      const headersList = await headers();
      const host = headersList.get("host") ?? "localhost:3001";
      const protocol = host.startsWith("localhost") ? "http" : "https";
      const renderUrl = `${protocol}://${host}/cover-letter-render/${id}`;

      await page.setCookie({
        name: "resumi-locale",
        value: locale,
        domain: host.split(":")[0],
        path: "/",
      });

      await page.goto(renderUrl, { waitUntil: "networkidle0", timeout: 30000 });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });

      const filename = `${(cl.title || "Cover Letter").replace(/[^a-zA-Z0-9-_ ]/g, "")}.pdf`;
      return new Response(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (err) {
    log.error("cover_letter_pdf_failed", { coverLetterId: id, err });
    return new Response("Failed to generate PDF", { status: 500 });
  }
}
