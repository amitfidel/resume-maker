import { resolveResume } from "@/lib/resume/resolve";
import { notFound } from "next/navigation";
import { TemplateRenderer } from "@/templates/renderer";
import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n/dictionary";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * The page Puppeteer fetches to produce the PDF.
 *
 * Auth bypass: `/resume-render/[uuid]` is exempt in middleware so the
 * headless browser (no user cookies) can fetch it.
 *
 * Locale plumbing: the PDF route sets a `resumi-locale` cookie on the
 * headless browser before navigating here. The root layout reads the
 * cookie and primes I18nProvider — so by the time TemplateRenderer
 * runs, useT() already returns Hebrew (and <html lang="he" dir="rtl">
 * is set server-side, no nested-provider gymnastics needed).
 *
 * Page-level CSS injects Hebrew web fonts and a body-level font
 * override so template inline styles can't pin Latin-only fonts and
 * produce empty boxes for Hebrew glyphs. Also hides root-layout
 * overlays (TweaksPanel button, command palette) marked `data-pdf-hide`.
 */
export default async function ResumeRenderPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("resumi-locale")?.value;
  const locale: Locale = localeCookie === "he" ? "he" : "en";

  const resolved = await resolveResume(id);
  if (!resolved) notFound();

  const fontImports =
    locale === "he"
      ? `@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&family=Frank+Ruhl+Libre:wght@400;500;700&display=swap');
         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`
      : `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
         @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');`;

  const heFontOverride =
    locale === "he"
      ? `body, body * { font-family: "Heebo", "Frank Ruhl Libre", "Arial", sans-serif !important; }`
      : "";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            ${fontImports}
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: white; }
            @page { margin: 0; size: A4; }
            /* Hide root-layout overlays (Tweaks FAB, command palette) from the PDF */
            [data-pdf-hide] { display: none !important; }
            ${heFontOverride}
          `,
        }}
      />
      <TemplateRenderer resume={resolved} />
    </>
  );
}
