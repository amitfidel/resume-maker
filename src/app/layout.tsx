import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-headline" });

export const metadata: Metadata = {
  title: "The Architect - AI Resume Workspace",
  description:
    "Architect your professional identity. Create, tailor, and track polished resumes with AI assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, manrope.variable)}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
