"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Target, Loader2, X, Check, ArrowRight } from "lucide-react";

type Suggestion = {
  section: string;
  type: string;
  original: string | null;
  suggested: string;
  reason: string;
};

type Analysis = {
  matchScore: number;
  keywordMatches: string[];
  missingKeywords: string[];
  suggestions: Suggestion[];
  overallFeedback: string;
};

type Props = {
  resumeId: string;
  onClose: () => void;
};

export function JobTailorPanel({ resumeId, onClose }: Props) {
  const [jd, setJd] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!jd.trim()) return;
    setIsLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch("/api/ai/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobDescription: jd }),
      });
      const data = await res.json();
      if (data.data) setAnalysis(data.data);
    } catch (err) {
      console.error("Tailor error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [resumeId, jd]);

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col overflow-hidden border-l border-[var(--border-ghost)] bg-[var(--surface-raised)]">
      <div className="flex items-center justify-between border-b border-[var(--border-ghost)] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-[8px]"
            style={{
              background: "linear-gradient(135deg, var(--magic-1), var(--magic-2))",
              boxShadow: "var(--sh-magic)",
            }}
          >
            <Target className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="font-headline text-[16px] tracking-[-0.01em] text-[var(--on-surface)]">
            Job tailor
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!analysis ? (
          <>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Paste a job description to get tailoring suggestions.
              </p>
              <Textarea
                placeholder="Paste the job description here..."
                rows={8}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isLoading || !jd.trim()}
              className="magical-gradient magic-shine w-full rounded-full"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Target className="mr-2 h-3.5 w-3.5" />
                  Analyze match
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            {/* Match Score */}
            <div className="rounded-2xl bg-[var(--surface-sunk)] p-5 text-center">
              <div
                className={`font-headline text-[44px] font-normal leading-none tracking-[-0.02em] ${
                  analysis.matchScore >= 70
                    ? "text-[var(--success)]"
                    : analysis.matchScore >= 40
                    ? "text-[var(--warn)]"
                    : "text-[var(--destructive)]"
                }`}
              >
                {analysis.matchScore}
                <span className="text-[22px]">%</span>
              </div>
              <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                Match score
              </p>
            </div>

            {/* Feedback */}
            <p className="text-sm text-muted-foreground">
              {analysis.overallFeedback}
            </p>

            {/* Keywords */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Matched Keywords
              </p>
              <div className="flex flex-wrap gap-1">
                {analysis.keywordMatches.map((kw) => (
                  <Badge key={kw} variant="secondary" className="text-xs">
                    <Check className="mr-1 h-2.5 w-2.5" />
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>

            {analysis.missingKeywords.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Missing Keywords
                </p>
                <div className="flex flex-wrap gap-1">
                  {analysis.missingKeywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="outline"
                      className="text-xs border-amber-300 text-amber-700"
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Suggestions ({analysis.suggestions.length})
              </p>
              {analysis.suggestions.map((sug, i) => (
                <div
                  key={i}
                  className="rounded-md border p-3 space-y-1.5 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {sug.section}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {sug.type}
                    </Badge>
                  </div>
                  {sug.original && (
                    <p className="text-muted-foreground line-through text-xs">
                      {sug.original}
                    </p>
                  )}
                  <div className="flex items-start gap-1">
                    <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-[var(--success)]" />
                    <p className="text-xs">{sug.suggested}</p>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    {sug.reason}
                  </p>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setAnalysis(null)}
            >
              Try Another Job
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
