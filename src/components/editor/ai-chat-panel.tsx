"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  Mic,
  MicOff,
} from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useT } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
  actions?: Array<{ tool: string; description: string }>;
};

type Props = {
  resumeId: string;
  onClose: () => void;
};

export function AiChatPanel({ resumeId, onClose }: Props) {
  const router = useRouter();
  const t = useT();
  const SUGGESTIONS = [
    t("ai.suggest.summary"),
    t("ai.suggest.metrics"),
    t("ai.suggest.reorder"),
    t("ai.suggest.rewrite"),
  ];
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: t("ai.initial") },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const baseInputRef = useRef<string>("");
  // AbortController for the in-flight chat fetch. Closing the panel or
  // unmounting cancels — server-side this propagates into streamText
  // and stops the upstream Groq call from billing tokens for output
  // nobody will read.
  const abortRef = useRef<AbortController | null>(null);

  // Abort on unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Speech recognition - appends transcripts to the input
  const handleTranscript = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (isFinal) {
        // Append final transcript to the base input with a space
        const newBase =
          (baseInputRef.current ? baseInputRef.current + " " : "") + transcript.trim();
        baseInputRef.current = newBase;
        setInput(newBase);
      } else {
        // Show interim transcript alongside base
        const preview = baseInputRef.current
          ? baseInputRef.current + " " + transcript
          : transcript;
        setInput(preview);
      }
    },
    []
  );

  const { isSupported, isListening, error: speechError, toggle, stop } =
    useSpeechRecognition({ onTranscript: handleTranscript });

  // Keep baseInputRef in sync when user manually edits the input
  useEffect(() => {
    if (!isListening) {
      baseInputRef.current = input;
    }
  }, [input, isListening]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      // Stop listening before sending
      stop();
      baseInputRef.current = "";

      const userMsg: Message = { role: "user", content: text };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setIsLoading(true);

      // Cancel any prior in-flight call (very rare — UI disables while
      // loading — but defensive against double-fires).
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            resumeId,
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!res.ok) {
          // Non-2xx — server still returns JSON for fatal errors.
          let errorText = "Something went wrong";
          try {
            const data = await res.json();
            errorText = data.error ?? errorText;
          } catch {
            // ignore parse failure, fall through with default
          }
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Sorry, I ran into an error: ${errorText}`,
            },
          ]);
        } else if (!res.body) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "No response body from server.",
            },
          ]);
        } else {
          // Push a fresh assistant message that we'll mutate in-place as
          // text and action events stream in.
          let assistantIndex = -1;
          setMessages((prev) => {
            assistantIndex = prev.length;
            return [...prev, { role: "assistant", content: "", actions: [] }];
          });

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let actionCount = 0;

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            // NDJSON: handle complete lines, leave any partial tail for the
            // next iteration.
            let nl: number;
            while ((nl = buffer.indexOf("\n")) >= 0) {
              const line = buffer.slice(0, nl).trim();
              buffer = buffer.slice(nl + 1);
              if (!line) continue;
              try {
                const evt = JSON.parse(line) as
                  | { type: "text-delta"; delta: string }
                  | { type: "action"; tool: string; description: string }
                  | { type: "error"; error: string }
                  | { type: "done" };

                if (evt.type === "text-delta") {
                  setMessages((prev) => {
                    const next = [...prev];
                    const target = next[assistantIndex];
                    if (target) {
                      next[assistantIndex] = {
                        ...target,
                        content: target.content + evt.delta,
                      };
                    }
                    return next;
                  });
                } else if (evt.type === "action") {
                  actionCount++;
                  setMessages((prev) => {
                    const next = [...prev];
                    const target = next[assistantIndex];
                    if (target) {
                      next[assistantIndex] = {
                        ...target,
                        actions: [
                          ...(target.actions ?? []),
                          { tool: evt.tool, description: evt.description },
                        ],
                      };
                    }
                    return next;
                  });
                } else if (evt.type === "error") {
                  setMessages((prev) => {
                    const next = [...prev];
                    const target = next[assistantIndex];
                    if (target) {
                      next[assistantIndex] = {
                        ...target,
                        content:
                          target.content +
                          (target.content ? "\n\n" : "") +
                          `Error: ${evt.error}`,
                      };
                    }
                    return next;
                  });
                }
                // "done" — nothing to do
              } catch {
                // malformed line — skip
              }
            }
          }

          if (actionCount > 0) {
            router.refresh();
            // Tell the undo controller "the state changed". Server
            // actions invoked from this stream don't pass through the
            // trackSave wrapper that normally fires this event, so the
            // post-AI state would otherwise miss the undo stack.
            window.dispatchEvent(new CustomEvent("resumi:save-end"));
          }
        }
      } catch (err) {
        // AbortError = user closed the panel / sent a new message — no
        // surface, just stop. Anything else is a real connection error.
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        console.error("Chat error:", err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Connection error. Please try again." },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, resumeId, router, stop]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
  };

  return (
    <aside className="absolute inset-0 z-20 flex h-full shrink-0 flex-col overflow-hidden border-l border-[var(--border-ghost)] bg-[var(--surface-raised)] lg:relative lg:w-[360px]">
      {/* Header */}
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
            {t("ai.title")}
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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto p-5">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[92%] px-3.5 py-3 text-[13px] leading-[1.5] ${
                msg.role === "user"
                  ? "rounded-[14px] rounded-br-[4px] bg-[var(--ink)] text-[var(--cream)]"
                  : "rounded-[14px] rounded-bl-[4px] bg-[var(--magic-tint)] text-[var(--magic-1)] dark:text-[#d9caff]"
              }`}
              style={{ animation: "bubble-in 500ms var(--ease-spring) both" }}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {msg.actions && msg.actions.length > 0 && (
                <div
                  className={`mt-3 space-y-1.5 border-t pt-3 ${
                    msg.role === "user" ? "border-white/10" : "border-[var(--magic-1)]/10"
                  }`}
                >
                  {msg.actions.map((action, ai) => (
                    <div
                      key={ai}
                      className={`font-mono flex items-center gap-2 text-[11px] ${
                        msg.role === "user" ? "text-white/80" : "text-[var(--on-surface-soft)]"
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-[var(--success)]" />
                      <span>{action.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div
              className="font-mono flex items-center gap-2 rounded-[10px] bg-[var(--surface-sunk)] px-3 py-2.5 text-[12px] text-[var(--on-surface-soft)]"
              style={{ animation: "bubble-in 500ms var(--ease-spring) both" }}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("ai.thinking")}
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length === 1 && !isLoading && (
        <div className="border-t border-[var(--border-ghost)] px-5 py-3.5">
          <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
            {t("ai.try_asking")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="rounded-full bg-[var(--surface-sunk)] px-3 py-1.5 text-[12px] text-[var(--on-surface-soft)] transition-colors hover:bg-[var(--magic-tint)] hover:text-[var(--magic-1)]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Listening indicator */}
      {isListening && (
        <div className="flex items-center gap-2 border-t border-[var(--border-ghost)] bg-[color:color-mix(in_oklab,var(--magic-tint)_70%,transparent)] px-5 py-2 text-[12px] text-[var(--magic-1)]">
          <div className="flex gap-0.5">
            {[0, 150, 300, 450].map((d) => (
              <span
                key={d}
                className="h-3 w-0.5 animate-pulse rounded-full bg-[var(--magic-2)]"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
          <span>{t("ai.listening")}</span>
        </div>
      )}

      {speechError && (
        <div className="border-t border-[var(--border-ghost)] bg-[color:color-mix(in_oklab,var(--warn)_15%,transparent)] px-5 py-2 text-[12px] text-[var(--warn)]">
          Mic error: {speechError}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4">
        <div
          className="flex items-end gap-2.5 rounded-[12px] bg-[var(--surface-raised)] p-3 transition-shadow focus-within:shadow-[inset_0_0_0_2px_var(--magic-2),0_6px_20px_-8px_var(--magic-glow)]"
          style={{
            boxShadow: "inset 0 0 0 1px var(--border-ghost-strong), var(--sh-1)",
          }}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={isListening ? t("ai.listening") : t("ai.placeholder")}
            rows={2}
            className="max-h-[120px] flex-1 resize-none border-0 bg-transparent p-0 text-[14px] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent"
            disabled={isLoading}
          />
          <div className="flex gap-1.5">
            {isSupported && (
              <button
                type="button"
                onClick={toggle}
                disabled={isLoading}
                title={isListening ? "Stop listening" : "Speak your message"}
                className={cn(
                  "grid h-8 w-8 flex-none place-items-center rounded-[8px] transition-all",
                  isListening
                    ? "bg-[color:color-mix(in_oklab,var(--magic-tint)_80%,transparent)] text-[var(--magic-1)] animate-pulse"
                    : "text-[var(--on-surface-muted)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
                )}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="grid h-8 w-8 flex-none place-items-center rounded-[8px] text-white transition-opacity disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, var(--magic-1), var(--magic-2))",
                boxShadow: "var(--sh-magic)",
              }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
        {!isSupported && (
          <p className="mt-2 text-[11px] text-[var(--on-surface-muted)]">
            Voice input requires Chrome, Edge, or Safari.
          </p>
        )}
      </form>
    </aside>
  );
}
