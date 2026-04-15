"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableBlock } from "./sortable-block";
import { AddSectionButton } from "./add-section-button";
import { reorderBlocks, toggleBlockVisibility } from "@/app/(dashboard)/resumes/actions";
import type { ResolvedBlock } from "@/lib/resume/types";

type Props = {
  resumeId: string;
  blocks: ResolvedBlock[];
};

export function BlockList({ resumeId, blocks: initialBlocks }: Props) {
  const [blocks, setBlocks] = useState(initialBlocks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);

    const newBlocks = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(newBlocks);

    // Persist the new order
    await reorderBlocks(
      resumeId,
      newBlocks.map((b) => b.id)
    );
  }

  async function handleToggleVisibility(blockId: string) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, isVisible: !b.isVisible } : b
      )
    );
    await toggleBlockVisibility(resumeId, blockId);
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Sections</h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5">
            {blocks.map((block) => (
              <SortableBlock
                key={block.id}
                block={block}
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AddSectionButton
        resumeId={resumeId}
        existingBlockTypes={blocks.map((b) => b.type)}
      />
    </div>
  );
}
