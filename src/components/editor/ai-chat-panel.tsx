"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
  actions?: Array<{ tool: string; description: string }>;
};

type Props = {
  resumeId: string;
  onClose: () => void;
};

const SUGGESTIONS = [
  "Make my summary more concise",
  "Add more metrics to my bullets",
  "Reorder sections - put skills before experience",
  "Rewrite my first bullet to sound stronger",
];

export function AiChatPanel({ resumeId, onClose }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your resume assistant. Tell me what you'd like to change - I can rewrite bullets, reorder sections, update your summary, or hide items. What would you like to improve?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: Message = { role: "user", content: text };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeId,
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Sorry, I ran into an error: ${data.error ?? "Something went wrong"}`,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.text,
              actions: data.actions,
            },
          ]);

          // If changes were made, refresh the page to show them
          if (data.actions && data.actions.length > 0) {
            router.refresh();
          }
        }
      } catch (err) {
        console.error("Chat error:", err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Connection error. Please try again." },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, resumeId, router]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
  };

  return (
    <aside className="flex h-full w-96 shrink-0 flex-col bg-[var(--surface-container-lowest)] border-l border-ghost">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ghost px-4 py-3 glass-effect">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md magical-gradient">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="font-headline text-sm font-bold text-[var(--on-surface)]">
            Magic AI Chat
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-[var(--on-surface-variant)]"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm ${
                msg.role === "user"
                  ? "magical-gradient text-white"
                  : "bg-[var(--surface-container)] text-[var(--on-surface)]"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

              {/* Action chips */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
                  {msg.actions.map((action, ai) => (
                    <div
                      key={ai}
                      className={`flex items-center gap-2 text-xs ${
                        msg.role === "user" ? "text-white/90" : "text-[var(--on-surface-variant)]"
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
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
            <div className="bg-[var(--surface-container)] rounded-lg px-3.5 py-2.5 text-sm text-[var(--on-surface-variant)]">
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions (only show if only greeting message) */}
      {messages.length === 1 && !isLoading && (
        <div className="border-t border-ghost px-4 py-3 bg-[var(--surface-container-low)]">
          <p className="text-[0.7rem] font-medium uppercase tracking-wider text-[var(--on-surface-variant)] mb-2">
            Try asking
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="rounded-md bg-[var(--surface-container-lowest)] px-2.5 py-1 text-xs text-[var(--on-surface)] hover:bg-[var(--surface-container)] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-ghost p-3 bg-[var(--surface-container-low)]"
      >
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask me to change something..."
            rows={2}
            className="flex-1 resize-none bg-[var(--surface-container-lowest)] border-ghost text-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="magical-gradient text-white h-9 w-9 shrink-0"
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </aside>
  );
}
