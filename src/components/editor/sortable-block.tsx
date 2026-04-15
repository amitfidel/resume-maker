"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResolvedBlock } from "@/lib/resume/types";

type Props = {
  block: ResolvedBlock;
  onToggleVisibility: (blockId: string) => void;
};

const BLOCK_ICONS: Record<string, string> = {
  summary: "S",
  experience: "E",
  education: "Ed",
  skills: "Sk",
  projects: "Pr",
  certifications: "Ce",
  custom: "Cu",
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
        "flex items-center gap-2 rounded-lg border bg-card p-3 transition-shadow",
        isDragging && "shadow-lg opacity-90 z-50",
        !block.isVisible && "opacity-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-semibold text-muted-foreground">
        {BLOCK_ICONS[block.type] ?? "?"}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{block.heading}</p>
        <p className="text-xs text-muted-foreground">
          {block.items.length} item{block.items.length !== 1 ? "s" : ""}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={() => onToggleVisibility(block.id)}
      >
        {block.isVisible ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}
