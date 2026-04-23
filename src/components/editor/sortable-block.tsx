"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import type { ResolvedBlock } from "@/lib/resume/types";

type Props = {
  block: ResolvedBlock;
  onToggleVisibility: (blockId: string) => void;
};

export function SortableBlock({ block, onToggleVisibility }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const itemCount =
    "items" in block && Array.isArray((block as { items?: unknown[] }).items)
      ? (block as { items: unknown[] }).items.length
      : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex cursor-grab select-none items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] transition-colors",
        isDragging &&
          "z-50 bg-[var(--magic-tint)] text-[var(--magic-1)] shadow-[inset_0_0_0_1px_var(--magic-2)]",
        !isDragging && "hover:bg-[var(--surface-sunk)]",
        block.isVisible
          ? "text-[var(--on-surface-soft)] hover:text-[var(--on-surface)]"
          : "text-[var(--on-surface-muted)]",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-[var(--on-surface-faint)] opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span
        className={cn(
          "flex-1 min-w-0 truncate capitalize",
          !block.isVisible && "line-through",
        )}
      >
        {block.heading}
      </span>

      {itemCount > 0 && (
        <span className="font-mono text-[10px] text-[var(--on-surface-faint)]">
          {itemCount.toString().padStart(2, "0")}
        </span>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility(block.id);
        }}
        aria-label={block.isVisible ? "Hide section" : "Show section"}
        className={cn(
          "rounded p-1 text-[var(--on-surface-muted)] transition-all hover:bg-[var(--surface)] hover:text-[var(--on-surface)]",
          block.isVisible
            ? "opacity-0 group-hover:opacity-100"
            : "opacity-100",
        )}
      >
        {block.isVisible ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
