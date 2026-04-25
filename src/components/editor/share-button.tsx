"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import { useT, useI18n } from "@/lib/i18n/context";

/**
 * "Share" button — copies a public read-only render URL for the resume
 * to the clipboard. The URL points at /resume-render/[id], which is
 * exempt from middleware auth (anyone with the UUID can view) — the
 * UUID is unguessable, so this is "share by link" privacy. Same level
 * as a Google Doc with link sharing on.
 */
export function ShareButton({ resumeId }: { resumeId: string }) {
  const t = useT();
  const { locale } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/resume-render/${resumeId}?locale=${encodeURIComponent(locale)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Some browsers / contexts disallow clipboard. Fall back to a prompt.
      window.prompt("URL", url);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`h-9 gap-1.5 rounded-full text-[13px] transition-colors ${
        copied
          ? "bg-[var(--success)]/15 text-[var(--success)]"
          : "text-[var(--on-surface-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
      }`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? t("resumes.share.copied") : t("resumes.share")}
    </Button>
  );
}
