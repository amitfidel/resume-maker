"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/context";

type Props = {
  text: string;
  onAccept: (newText: string) => void;
  onDismiss: () => void;
};

export function AiRewritePopover({ text, onAccept, onDismiss }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const t = useT();
  const ACTIONS = [
    { id: "improve", label: t("rewrite.title"), color: "magical-gradient text-white" },
    { id: "concise", label: t("rewrite.improve"), color: "bg-[var(--surface-container)] text-[var(--on-surface)]" },
    { id: "metrics", label: t("rewrite.metrics"), color: "bg-[var(--surface-container)] text-[var(--on-surface)]" },
  ];

  const handleAction = useCallback(
    async (action: string) => {
      setSuggestion(null);
      setIsLoading(true);

      try {
        const res = await fetch("/api/ai/rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, action }),
        });

        if (!res.ok) {
          console.error("AI rewrite failed:", res.status);
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        setSuggestion(data.result);
      } catch (err) {
        console.error("AI rewrite error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [text]
  );

  return (
    <div
      className="w-80 rounded-lg bg-[var(--surface-container-lowest)] p-4 shadow-ambient border-ghost"
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Action buttons */}
      {!suggestion && !isLoading && (
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 ${action.color}`}
              onClick={() => handleAction(action.id)}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 py-2 text-sm text-[var(--on-surface-variant)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--tertiary)]" />
          {t("rewrite.rewriting")}
        </div>
      )}

      {/* Result */}
      {suggestion && (
        <div className="space-y-3">
          <div className="rounded-md bg-[var(--tertiary-fixed)] p-3 text-sm text-[var(--on-surface)]">
            {suggestion}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 flex-1 text-xs magical-gradient text-white"
              onClick={() => onAccept(suggestion)}
            >
              <Check className="mr-1 h-3 w-3" />
              {t("rewrite.accept")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSuggestion(null)}
            >
              {t("rewrite.retry")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
