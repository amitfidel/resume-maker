"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, X } from "lucide-react";
import { useT } from "@/lib/i18n/context";

type Props = {
  resumeId: string;
  onClose: () => void;
};

export function AiReviewPanel({ resumeId, onClose }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [review, setReview] = useState("");
  const t = useT();

  const handleReview = useCallback(async () => {
    setReview("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId }),
      });

      if (!res.ok) {
        console.error("Review failed:", res.status);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      setReview(data.result);
    } catch (err) {
      console.error("Review error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [resumeId]);

  return (
    <aside className="absolute inset-0 z-20 flex h-full shrink-0 flex-col overflow-hidden border-l border-[var(--border-ghost)] bg-[var(--surface-raised)] lg:relative lg:w-[360px]">
      <div className="flex items-center justify-between border-b border-[var(--border-ghost)] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-[8px]"
            style={{
              background: "linear-gradient(135deg, var(--magic-1), var(--magic-2))",
              boxShadow: "var(--sh-magic)",
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="font-headline text-[16px] tracking-[-0.01em] text-[var(--on-surface)]">
            AI review
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-[10px] text-[var(--on-surface-muted)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {!review && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className="mb-4 grid h-12 w-12 place-items-center rounded-[14px]"
              style={{ background: "var(--magic-tint)" }}
            >
              <Sparkles className="h-5 w-5 text-[var(--magic-1)]" />
            </div>
            <p className="text-sm text-[var(--on-surface-muted)]">
              {t("review.empty")}
            </p>
            <Button
              onClick={handleReview}
              size="sm"
              className="magical-gradient magic-shine mt-4 rounded-full"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              {t("review.run")}
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="font-mono flex items-center gap-2 rounded-[10px] bg-[var(--surface-sunk)] px-3 py-2.5 text-[12px] text-[var(--on-surface-soft)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t("review.running")}
          </div>
        )}

        {review && (
          <div
            className="prose prose-sm max-w-none text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(review) }}
          />
        )}

        {!isLoading && review && (
          <div className="mt-4 border-t border-[var(--border-ghost)] pt-4">
            <Button
              onClick={handleReview}
              variant="outline"
              size="sm"
              className="w-full rounded-full border-0 bg-[var(--surface-raised)] text-[var(--on-surface)] shadow-[inset_0_0_0_1px_var(--border-ghost-strong)] hover:shadow-[inset_0_0_0_1px_var(--ink)]"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              {t("review.again")}
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*<\/li>)/, "<ul>$1</ul>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}
