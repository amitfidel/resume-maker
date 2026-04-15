"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";

type Props = {
  text: string;
  onAccept: (newText: string) => void;
  onDismiss: () => void;
};

const ACTIONS = [
  { id: "improve", label: "Improve", icon: "✨" },
  { id: "concise", label: "Concise", icon: "✂️" },
  { id: "metrics", label: "Add Metrics", icon: "📊" },
  { id: "stronger", label: "Stronger", icon: "💪" },
] as const;

export function AiRewritePopover({ text, onAccept, onDismiss }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

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
      className="w-80 rounded-lg border bg-popover p-3 shadow-lg"
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Action buttons */}
      {!suggestion && !isLoading && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            AI Rewrite
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ACTIONS.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleAction(action.id)}
              >
                <span className="mr-1">{action.icon}</span>
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Rewriting...
        </div>
      )}

      {/* Result */}
      {suggestion && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Suggestion</p>
          <div className="rounded-md bg-muted p-2 text-sm">{suggestion}</div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => onAccept(suggestion)}
            >
              <Check className="mr-1 h-3 w-3" />
              Accept
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSuggestion(null)}
            >
              Retry
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
