"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, X } from "lucide-react";

type Props = {
  resumeId: string;
  onClose: () => void;
};

export function AiReviewPanel({ resumeId, onClose }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [review, setReview] = useState("");

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
    <aside className="flex h-full w-80 shrink-0 flex-col border-l bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-semibold">AI Review</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!review && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="mb-3 h-10 w-10 text-purple-300" />
            <p className="text-sm text-muted-foreground">
              Get AI-powered feedback on your resume.
            </p>
            <Button onClick={handleReview} className="mt-4" size="sm">
              <Sparkles className="mr-2 h-4 w-4" />
              Review My Resume
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing your resume...
          </div>
        )}

        {review && (
          <div
            className="prose prose-sm max-w-none text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(review) }}
          />
        )}

        {!isLoading && review && (
          <div className="mt-4 border-t pt-4">
            <Button onClick={handleReview} variant="outline" size="sm" className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              Review Again
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
