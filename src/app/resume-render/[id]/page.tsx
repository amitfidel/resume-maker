import { resolveResume } from "@/lib/resume/resolve";
import { notFound } from "next/navigation";
import { TemplateRenderer } from "@/templates/renderer";
import { I18nProvider } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/dictionary";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locale?: string }>;
};

/**
 * The page Puppeteer fetches to produce the PDF. Bypasses the root layout
 * (renders its own <html>) so it can pin the locale via search param without
 * relying on localStorage. The PDF route forwards the user's UI locale via
 * `?locale=...` when triggering the export.
 */
export default async function ResumeRenderPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { locale: localeParam } = await searchParams;
  const locale: Locale = localeParam === "he" ? "he" : "en";

  const resolved = await resolveResume(id);
  if (!resolved) notFound();

  // For Hebrew, load Heebo + Frank Ruhl Libre via Google Fonts so headless
  // Chromium has glyphs to draw with. For English, the existing Inter +
  // Manrope cover what the templates need.
  const fontImports =
    locale === "he"
      ? `@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&family=Frank+Ruhl+Libre:wght@400;500;700&display=swap');
         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`
      : `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
         @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');`;

  // Force Hebrew-capable fonts on every element of the rendered resume so
  // template inline styles (which would otherwise pin Inter/Georgia) don't
  // produce empty boxes for Hebrew glyphs. !important is heavy-handed but
  // localized to this single page (the PDF render only).
  const heOverride =
    locale === "he"
      ? `body, body * { font-family: "Heebo", "Frank Ruhl Libre", "Arial", sans-serif !important; }`
      : "";

  return (
    <html lang={locale} dir={locale === "he" ? "rtl" : "ltr"}>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              ${fontImports}
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { background: white; }
              @page { margin: 0; size: A4; }
              ${heOverride}
            `,
          }}
        />
      </head>
      <body>
        <I18nProvider initialLocale={locale}>
          <TemplateRenderer resume={resolved} />
        </I18nProvider>
      </body>
    </html>
  );
}
