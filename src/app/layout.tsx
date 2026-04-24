import type { Metadata } from "next";
import { Instrument_Serif, Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { TweaksPanel } from "@/components/layout/tweaks-panel";
import { CommandPalette } from "@/components/layout/command-palette";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";
import { I18nProvider } from "@/lib/i18n/context";
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

export const metadata: Metadata = {
  title: "Resumi — Your career, composed.",
  description:
    "Resumi is the editorial AI resume workspace. Compose, tailor, and track polished resumes with a smooth, thoughtful editor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
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
        <I18nProvider>
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
