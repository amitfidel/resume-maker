import type { Metadata } from "next";
import { Instrument_Serif, Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { cn } from "@/lib/utils";
import { TweaksPanel } from "@/components/layout/tweaks-panel";
import { CommandPalette } from "@/components/layout/command-palette";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";
import { I18nProvider } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/dictionary";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["300", "400", "500", "600", "700"],
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
  style: ["normal", "italic"],
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono-g",
  weight: ["400", "500"],
});

const SITE_NAME = "Resumi";
const SITE_TITLE = "Resumi — Your career, composed.";
const SITE_DESCRIPTION =
  "Resumi is the editorial AI resume workspace. Compose, tailor, and track polished resumes with a smooth, thoughtful editor.";

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: "%s · Resumi",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  keywords: [
    "resume builder",
    "AI resume",
    "CV maker",
    "career",
    "job search",
    "Resumi",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    alternateLocale: ["he_IL"],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side locale primer. Read by the PDF flow: the route sets a
  // `resumi-locale` cookie on the headless browser before navigation, so
  // the resume-render page hydrates in the right language without any
  // nested-provider gymnastics. For real user sessions this cookie is
  // unset and the I18nProvider falls back to localStorage on the client.
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("resumi-locale")?.value;
  const initialLocale: Locale | undefined =
    cookieLocale === "he" || cookieLocale === "en" ? cookieLocale : undefined;

  return (
    <html
      lang={initialLocale ?? "en"}
      dir={initialLocale === "he" ? "rtl" : "ltr"}
      className={cn(geist.variable, instrumentSerif.variable, geistMono.variable)}
      data-accent="indigo"
      data-density="comfortable"
      data-motion="expressive"
      data-texture="paper"
      suppressHydrationWarning
    >
      {/*
        `suppressHydrationWarning` silences diffs caused by browser extensions
        injecting attributes (e.g. Edge's form-filler adds `fdprocessedid` to
        every form control between SSR and hydration). No app-logic effect.
      */}
      <body className="font-body antialiased" suppressHydrationWarning>
        <I18nProvider initialLocale={initialLocale}>
          <ConfirmDialogProvider>
            {children}
            <CommandPalette />
            <TweaksPanel />
          </ConfirmDialogProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
