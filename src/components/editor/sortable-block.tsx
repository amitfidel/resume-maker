"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical, Eye, EyeOff, ChevronRight } from "lucide-react";
import type { ResolvedBlock } from "@/lib/resume/types";

type Props = {
  block: ResolvedBlock;
  onToggleVisibility: (blockId: string) => void;
};

const BLOCK_ICONS: Record<string, string> = {
  summary: "S",
  experience: "W",
  education: "E",
  skills: "S",
  projects: "P",
  certifications: "C",
  custom: "X",
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2.5 transition-all cursor-pointer",
        isDragging && "shadow-ambient opacity-90 z-50 bg-[var(--surface-container-lowest)]",
        block.isVisible
          ? "text-[var(--on-surface)] hover:bg-[var(--surface-container)]"
          : "text-[var(--on-surface-variant)] opacity-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{block.heading}</p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility(block.id);
        }}
        className="text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
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
