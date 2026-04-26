import { notFound } from "next/navigation";
import { db } from "@/db";
import { coverLetters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resolveResume } from "@/lib/resume/resolve";
import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n/dictionary";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Headless render target for cover-letter PDFs. Mirrors
 * `/resume-render/[id]`: auth-exempt (Puppeteer has no cookies),
 * locale-primed via cookie, font-bombed for Hebrew. Output is a
 * single-page letter — serif, generous margins, sender block, date,
 * recipient, body, sign-off.
 */
export default async function CoverLetterRenderPage({ params }: Props) {
  const { id } = await params;

  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("resumi-locale")?.value;
  const locale: Locale = localeCookie === "he" ? "he" : "en";

  const cl = await db.query.coverLetters.findFirst({
    where: eq(coverLetters.id, id),
  });
  if (!cl) notFound();

  const resume = await resolveResume(cl.resumeId);
  if (!resume) notFound();

  const today = new Date().toLocaleDateString(
    locale === "he" ? "he-IL" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

  const greet =
    locale === "he"
      ? cl.recipientName
        ? `${cl.recipientName} שלום,`
        : "שלום,"
      : cl.recipientName
        ? `Dear ${cl.recipientName},`
        : "Dear Hiring Manager,";
  const closing = locale === "he" ? "בברכה," : "Sincerely,";

  const fontImports =
    locale === "he"
      ? `@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700&family=Frank+Ruhl+Libre:wght@400;500;700&display=swap');`
      : `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`;

  const heFontOverride =
    locale === "he"
      ? `body, body * { font-family: "Frank Ruhl Libre", "Heebo", "Arial", serif !important; }`
      : "";

  const bodyParas = (cl.body || "")
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            ${fontImports}
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: white; font-family: 'Georgia', 'Times New Roman', serif; color: #1a1a1a; }
            @page { margin: 0; size: A4; }
            [data-pdf-hide] { display: none !important; }
            .cl-page {
              width: 8.27in;
              min-height: 11.69in;
              padding: 0.95in 1in;
              margin: 0 auto;
              font-size: 11.5pt;
              line-height: 1.55;
              direction: ${locale === "he" ? "rtl" : "ltr"};
            }
            .cl-page p { margin-bottom: 0.85em; }
            .cl-sender-name { font-size: 14pt; font-weight: 700; margin-bottom: 4px; }
            .cl-sender-contact { font-size: 10pt; color: #555; }
            .cl-meta { margin-top: 0.7in; }
            .cl-recipient { margin-top: 0.5in; line-height: 1.4; }
            .cl-greet { margin-top: 0.4in; }
            .cl-body { margin-top: 0.25in; text-align: ${locale === "he" ? "right" : "justify"}; hyphens: auto; }
            .cl-close { margin-top: 0.45in; }
            ${heFontOverride}
          `,
        }}
      />
      <div className="cl-page">
        <div className="cl-sender-name">{resume.header.fullName || ""}</div>
        <div className="cl-sender-contact">
          {[resume.header.email, resume.header.phone].filter(Boolean).join(" | ")}
        </div>

        <div className="cl-meta">
          <p>{today}</p>
        </div>

        {(cl.recipientName || cl.recipientCompany) && (
          <div className="cl-recipient">
            {cl.recipientName && <div>{cl.recipientName}</div>}
            {cl.recipientCompany && <div>{cl.recipientCompany}</div>}
          </div>
        )}

        <div className="cl-greet">
          <p>{greet}</p>
        </div>

        <div className="cl-body">
          {bodyParas.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <div className="cl-close">
          <p>{closing}</p>
          <p>{resume.header.fullName || ""}</p>
        </div>
      </div>
    </>
  );
}
