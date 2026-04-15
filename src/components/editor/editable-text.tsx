"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { RotateCcw, Sparkles } from "lucide-react";
import { AiRewritePopover } from "./ai-rewrite-popover";

type Props = {
  value: string;
  originalValue?: string;
  onSave: (value: string) => void;
  className?: string;
  as?: "p" | "span" | "li" | "h1" | "h2";
  placeholder?: string;
  multiline?: boolean;
  aiEnabled?: boolean;
  style?: React.CSSProperties;
};

export function EditableText({
  value,
  originalValue,
  onSave,
  className,
  as: Tag = "span",
  placeholder = "Click to edit...",
  multiline = false,
  aiEnabled = false,
  style,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [text, setText] = useState(value);
  const ref = useRef<HTMLElement>(null);

  const hasOverride = originalValue !== undefined && value !== originalValue;
  const isEmpty = !text;

  useEffect(() => {
    setText(value);
  }, [value]);

  const startEditing = useCallback(() => {
    if (showAi) return;
    setEditing(true);
    requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.focus();
        // Clear placeholder text if the span shows a placeholder
        if (!text && ref.current.textContent) {
          ref.current.textContent = "";
        }
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    });
  }, [showAi, text]);

  const save = useCallback(() => {
    if (showAi) return;
    setEditing(false);
    const newText = ref.current?.textContent?.trim() ?? "";
    if (newText !== value) {
      setText(newText);
      onSave(newText);
    }
  }, [value, onSave, showAi]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !multiline) {
        e.preventDefault();
        save();
      }
      if (e.key === "Escape") {
        if (ref.current) ref.current.textContent = value;
        setEditing(false);
      }
    },
    [save, value, multiline]
  );

  const handleReset = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (originalValue !== undefined) {
        setText(originalValue);
        onSave(originalValue);
      }
    },
    [originalValue, onSave]
  );

  const handleAiAccept = useCallback(
    (newText: string) => {
      setText(newText);
      onSave(newText);
      setShowAi(false);
    },
    [onSave]
  );

  // Determine what to render inside the editable span
  // - When editing: render the current text (empty string is fine - we'll use min-width)
  // - When not editing and empty: render placeholder
  // - When not editing with value: render value
  const renderedContent = editing ? text : (text || placeholder);

  return (
    <span className="group/editable relative inline">
      <Tag
        ref={ref as React.Ref<never>}
        contentEditable={editing}
        suppressContentEditableWarning
        onClick={startEditing}
        onBlur={save}
        onKeyDown={handleKeyDown}
        style={style}
        className={cn(
          "outline-none transition-colors",
          // Ensure clickable area even when empty
          "inline-block min-w-[1.5ch]",
          !editing && !showAi && "cursor-text hover:bg-blue-50 rounded-sm",
          editing && "bg-blue-50 ring-1 ring-blue-300 rounded-sm px-0.5",
          hasOverride && !editing && "border-b border-dashed border-amber-400",
          isEmpty && !editing && "text-gray-300 italic",
          className
        )}
      >
        {renderedContent}
      </Tag>

      {/* Action buttons on hover */}
      {!editing && !showAi && (
        <span className="ml-1 hidden group-hover/editable:inline-flex items-center gap-0.5 align-middle">
          {aiEnabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAi(true);
              }}
              className="text-purple-500 hover:text-purple-700"
              title="AI rewrite"
            >
              <Sparkles className="h-3 w-3" />
            </button>
          )}
          {hasOverride && (
            <button
              onClick={handleReset}
              className="text-amber-500 hover:text-amber-700"
              title="Reset to profile value"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </span>
      )}

      {/* AI Popover - rendered via portal to escape overflow clipping */}
      {showAi && <AiPopoverPortal targetRef={ref} text={text} onAccept={handleAiAccept} onDismiss={() => setShowAi(false)} />}
    </span>
  );
}

function AiPopoverPortal({
  targetRef,
  text,
  onAccept,
  onDismiss,
}: {
  targetRef: React.RefObject<HTMLElement | null>;
  text: string;
  onAccept: (t: string) => void;
  onDismiss: () => void;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [targetRef]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}>
      <AiRewritePopover text={text} onAccept={onAccept} onDismiss={onDismiss} />
    </div>,
    document.body
  );
}
