"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import {
  updateSummary,
  updateItemField,
  updateBulletText,
  updateBlockHeading,
  addItemToBlock,
  removeItemFromBlock,
  addBulletToItem,
  deleteBullet,
  reorderBullets,
  toggleBlockVisibility,
  reorderBlocks,
  reorderItems,
  deleteBlock,
} from "@/app/(dashboard)/resumes/actions";
import { updateHeaderField } from "@/app/(dashboard)/profile/actions";
import { AddSectionButton } from "./add-section-button";
import { useResumeState } from "./resume-state";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useT } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import type {
  ResolvedResume,
  ResolvedBlock,
  ResolvedBlockItem,
  ResolvedExperience,
  ResolvedEducation,
  ResolvedSkill,
  ResolvedProject,
  ResolvedCertification,
  ResolvedCustomItem,
  ResolvedBullet,
  BlockType,
} from "@/lib/resume/types";

// ============================================================
// Save-event plumbing — integrates with <SaveIndicator>
// ============================================================

function useTrackedAction() {
  const router = useRouter();
  const [, start] = useTransition();
  // Accept any returning promise — call sites don't read the value, but
  // some server actions started returning structured data (e.g.
  // addItemToBlock returning the new itemId) and signature mismatch
  // shouldn't block usage here.
  return (fn: () => Promise<unknown>) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("resumi:save-start"));
    }
    start(async () => {
      try {
        await fn();
        router.refresh();
      } finally {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("resumi:save-end"));
        }
      }
    });
  };
}

// ============================================================
// Auto-save input / textarea
// ============================================================

type FieldProps = {
  label?: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  autoSize?: boolean;
  /** When "month", renders an HTML `<input type="month">`. */
  type?: "text" | "month";
  /** Fires on every keystroke — for optimistic live preview updates */
  onLive?: (next: string) => void;
  /** Fires on blur — for the persisted server action */
  onSave: (next: string) => void | Promise<void>;
  className?: string;
};

function Field({
  label,
  value,
  placeholder,
  multiline,
  rows = 2,
  autoSize,
  type = "text",
  onLive,
  onSave,
  className,
}: FieldProps) {
  const [local, setLocal] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDirtyRef = useRef(false);

  // Sync from prop when the authoritative value changes (e.g. after
  // router.refresh), unless the user is mid-edit on this input.
  useEffect(() => {
    if (!isDirtyRef.current) setLocal(value);
  }, [value]);

  useEffect(() => {
    if (!autoSize || !textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [local, autoSize]);

  const handleChange = (next: string) => {
    isDirtyRef.current = true;
    setLocal(next);
    onLive?.(next);
  };

  const save = () => {
    isDirtyRef.current = false;
    if (local === value) return;
    onSave(local);
  };

  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="mb-1 block text-[11px] font-medium text-[var(--on-surface-muted)]">
          {label}
        </span>
      )}
      {multiline ? (
        <textarea
          ref={textareaRef}
          value={local}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              (e.target as HTMLTextAreaElement).blur();
            }
          }}
          className="w-full resize-none rounded-[10px] bg-[var(--surface)] px-3 py-2.5 text-[13px] leading-[1.5] text-[var(--on-surface)] shadow-[inset_0_0_0_1px_var(--border-ghost)] outline-none transition-shadow placeholder:text-[var(--on-surface-faint)] focus:shadow-[inset_0_0_0_2px_var(--magic-2),0_4px_14px_-4px_var(--magic-glow)]"
        />
      ) : (
        <input
          type={type}
          value={local}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="w-full rounded-[10px] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--on-surface)] shadow-[inset_0_0_0_1px_var(--border-ghost)] outline-none transition-shadow placeholder:text-[var(--on-surface-faint)] focus:shadow-[inset_0_0_0_2px_var(--magic-2),0_4px_14px_-4px_var(--magic-glow)]"
        />
      )}
    </label>
  );
}

// ============================================================
// Section metadata
// ============================================================

function useSectionMeta() {
  const T = useT();
  const meta: Record<BlockType, { description: string; addLabel: string }> = {
    header: { description: "", addLabel: "" },
    summary: { description: T("ce.section.summary_hint"), addLabel: "" },
    experience: {
      description: T("ce.section.experience_hint"),
      addLabel: T("ce.add_item.experience"),
    },
    education: {
      description: T("ce.section.education_hint"),
      addLabel: T("ce.add_item.education"),
    },
    skills: {
      description: T("ce.section.skills_hint"),
      addLabel: T("ce.add_item.skills"),
    },
    projects: {
      description: T("ce.section.projects_hint"),
      addLabel: T("ce.add_item.projects"),
    },
    certifications: {
      description: T("ce.section.certifications_hint"),
      addLabel: T("ce.add_item.certifications"),
    },
    custom: {
      description: "",
      addLabel: T("ce.add_item.custom"),
    },
  };
  return meta;
}

// ============================================================
// Main ContentEditor
// ============================================================

export function ContentEditor() {
  const { resume } = useResumeState();
  const T = useT();
  const [blocks, setBlocks] = useState(resume.blocks);
  // Gate DnD rendering behind mount. dnd-kit's internal accessibility
  // announcer uses a module-level counter for `aria-describedby` IDs, which
  // drifts between SSR and hydration when we have nested DndContexts (blocks
  // + items inside each block). Rendering on client only avoids the counter
  // being touched during SSR at all.
  const [mounted, setMounted] = useState(false);

  useEffect(() => setBlocks(resume.blocks), [resume.blocks]);
  useEffect(() => setMounted(true), []);

  const run = useTrackedAction();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    const next = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(next);
    run(() => reorderBlocks(resume.id, next.map((b) => b.id)));
  };

  return (
    <div className="flex h-full w-full flex-shrink-0 flex-col overflow-hidden border-r border-[var(--border-ghost)] bg-[var(--surface-raised)] lg:w-[460px]">
      <div className="flex items-center justify-between border-b border-[var(--border-ghost)] px-5 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
            {T("ce.eyebrow")}
          </p>
          <h3 className="font-headline text-[16px] tracking-[-0.01em] text-[var(--on-surface)]">
            {T("ce.title")}
          </h3>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {mounted ? (
          <>
            <PersonalDetailsCard resume={resume} />

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                {blocks.map((block) => (
                  <SortableBlockCard key={block.id} block={block} resumeId={resume.id} />
                ))}
              </SortableContext>
            </DndContext>

            <div className="pt-2">
              <AddSectionButton
                resumeId={resume.id}
                existingBlockTypes={blocks.map((b) => b.type)}
              />
            </div>
          </>
        ) : (
          <EditorSkeleton blockCount={blocks.length} />
        )}
      </div>
    </div>
  );
}

/**
 * Rendered during the SSR pass + initial client render so the HTML matches.
 * Swapped for the real form tree after `useEffect` flips `mounted=true`.
 * Only visible for a single frame on a fast machine.
 */
function EditorSkeleton({ blockCount }: { blockCount: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="rounded-[12px] bg-[var(--surface-raised)] p-4 shadow-[inset_0_0_0_1px_var(--border-ghost)]">
        <div className="h-4 w-32 rounded bg-[var(--surface-sunk)]" />
        <div className="mt-2 h-3 w-56 rounded bg-[var(--surface-sunk)] opacity-60" />
      </div>
      {Array.from({ length: Math.max(1, blockCount) }).map((_, i) => (
        <div
          key={i}
          className="rounded-[12px] bg-[var(--surface-raised)] p-4 shadow-[inset_0_0_0_1px_var(--border-ghost)]"
        >
          <div className="h-4 w-40 rounded bg-[var(--surface-sunk)]" />
          <div className="mt-2 h-3 w-[70%] rounded bg-[var(--surface-sunk)] opacity-60" />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Personal Details — full editable form (writes to career profile)
// ============================================================

function PersonalDetailsCard({ resume }: { resume: ResolvedResume }) {
  const [open, setOpen] = useState(true);
  const run = useTrackedAction();
  const { patchHeader } = useResumeState();
  const T = useT();
  const h = resume.header;
  const save = (field: Parameters<typeof updateHeaderField>[0]) =>
    (v: string) => run(() => updateHeaderField(field, v));
  const live = (field: keyof typeof h) => (v: string) => patchHeader(field, v);

  return (
    <div className="overflow-hidden rounded-[12px] bg-[var(--surface-raised)] shadow-[inset_0_0_0_1px_var(--border-ghost)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-start"
      >
        <div>
          <h4 className="font-headline text-[16px] tracking-[-0.01em] text-[var(--on-surface)]">
            {T("ce.personal.title")}
          </h4>
          <p className="mt-0.5 text-[12px] leading-tight text-[var(--on-surface-muted)]">
            {T("ce.personal.lead")}
          </p>
        </div>
        <ChevronDown
          className="h-4 w-4 flex-none text-[var(--on-surface-muted)] transition-transform"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        />
      </button>

      {open && (
        <div className="space-y-2.5 border-t border-[var(--border-ghost)] p-4">
          <Field
            label={T("ce.field.fullname")}
            value={h.fullName ?? ""}
            placeholder="Avery Chen"
            onLive={live("fullName")}
            onSave={save("fullName")}
          />
          <Field
            label={T("ce.field.headline")}
            value={h.headline ?? ""}
            placeholder="Senior Product Designer · Systems & Tooling"
            onLive={live("headline")}
            onSave={save("headline")}
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Field
              label={T("ce.field.email")}
              value={h.email ?? ""}
              placeholder="you@example.com"
              onLive={live("email")}
              onSave={save("email")}
            />
            <Field
              label={T("ce.field.phone")}
              value={h.phone ?? ""}
              placeholder="+1 415 555 0100"
              onLive={live("phone")}
              onSave={save("phone")}
            />
          </div>
          <Field
            label={T("ce.field.location")}
            value={h.location ?? ""}
            placeholder="San Francisco, CA"
            onLive={live("location")}
            onSave={save("location")}
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Field
              label={T("ce.field.linkedin")}
              value={h.linkedinUrl ?? ""}
              placeholder="linkedin.com/in/…"
              onLive={live("linkedinUrl")}
              onSave={save("linkedinUrl")}
            />
            <Field
              label={T("ce.field.github")}
              value={h.githubUrl ?? ""}
              placeholder="github.com/…"
              onLive={live("githubUrl")}
              onSave={save("githubUrl")}
            />
          </div>
          <Field
            label={T("ce.field.website")}
            value={h.websiteUrl ?? ""}
            placeholder="https://…"
            onLive={live("websiteUrl")}
            onSave={save("websiteUrl")}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sortable block card
// ============================================================

function SortableBlockCard({
  block,
  resumeId,
}: {
  block: ResolvedBlock;
  resumeId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });
  const [open, setOpen] = useState(true);
  const run = useTrackedAction();
  const { patchBlockHeading } = useResumeState();

  const style = { transform: CSS.Transform.toString(transform), transition };
  const meta = useSectionMeta()[block.type];
  const confirm = useConfirm();
  const T = useT();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative overflow-hidden rounded-[12px] bg-[var(--surface-raised)] shadow-[inset_0_0_0_1px_var(--border-ghost)] transition-shadow",
        isDragging && "shadow-[inset_0_0_0_1px_var(--magic-2),var(--sh-3)]",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="absolute left-1 top-3.5 cursor-grab touch-none rounded p-1 text-[var(--on-surface-faint)] transition-colors hover:text-[var(--on-surface-muted)]"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-2 px-7 py-3.5">
        <div className="min-w-0 flex-1">
          <input
            value={block.heading}
            onChange={(e) => patchBlockHeading(block.id, e.target.value)}
            onBlur={(e) => {
              run(() =>
                updateBlockHeading(resumeId, block.id, e.target.value || null),
              );
            }}
            className={cn(
              "w-full bg-transparent text-[16px] font-semibold tracking-[-0.005em] text-[var(--on-surface)] outline-none rounded px-0.5 transition-shadow focus:shadow-[inset_0_0_0_2px_var(--magic-2)]",
              !block.isVisible && "text-[var(--on-surface-muted)] line-through",
            )}
          />
          {meta.description && (
            <p className="mt-0.5 pr-3 text-[12px] leading-tight text-[var(--on-surface-muted)]">
              {meta.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => run(() => toggleBlockVisibility(resumeId, block.id))}
            aria-label={block.isVisible ? "Hide section" : "Show section"}
            title={block.isVisible ? "Hide from resume" : "Show in resume"}
            className="rounded p-1.5 text-[var(--on-surface-muted)] transition-colors hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
          >
            {block.isVisible ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={async () => {
              const ok = await confirm({
                title: `${T("ce.confirm.delete_section.title")} (${block.heading})`,
                description: T("ce.confirm.delete_section.desc"),
                confirmLabel: T("ce.confirm.delete_section.cta"),
                destructive: true,
              });
              if (ok) run(() => deleteBlock(resumeId, block.id));
            }}
            aria-label={T("ce.confirm.delete_section.cta")}
            className="rounded p-1.5 text-[var(--on-surface-muted)] opacity-0 transition-all hover:bg-[var(--surface-sunk)] hover:text-[var(--destructive)] group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Collapse" : "Expand"}
            className="rounded p-1.5 text-[var(--on-surface-muted)] transition-transform"
            style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-3 border-t border-[var(--border-ghost)] p-4">
          <BlockBody block={block} resumeId={resumeId} />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Per-block dispatch
// ============================================================

function BlockBody({ block, resumeId }: { block: ResolvedBlock; resumeId: string }) {
  switch (block.type) {
    case "summary":
      return <SummaryEditor block={block} resumeId={resumeId} />;
    case "experience":
      return (
        <ItemsList
          block={block}
          resumeId={resumeId}
          ItemForm={ExperienceItem}
          summary={(i) => {
            const d = i.data as ResolvedExperience;
            return { title: d.title || "Untitled role", sub: d.company || "" };
          }}
        />
      );
    case "education":
      return (
        <ItemsList
          block={block}
          resumeId={resumeId}
          ItemForm={EducationItem}
          summary={(i) => {
            const d = i.data as ResolvedEducation;
            return { title: d.degree || d.institution || "Untitled", sub: d.institution };
          }}
        />
      );
    case "skills":
      return (
        <ItemsList
          block={block}
          resumeId={resumeId}
          ItemForm={SkillItem}
          summary={(i) => {
            const d = i.data as ResolvedSkill;
            return { title: d.name || "Untitled skill", sub: d.category || "" };
          }}
        />
      );
    case "projects":
      return (
        <ItemsList
          block={block}
          resumeId={resumeId}
          ItemForm={ProjectItem}
          summary={(i) => {
            const d = i.data as ResolvedProject;
            return { title: d.name || "Untitled project", sub: d.description || "" };
          }}
        />
      );
    case "certifications":
      return (
        <ItemsList
          block={block}
          resumeId={resumeId}
          ItemForm={CertificationItem}
          summary={(i) => {
            const d = i.data as ResolvedCertification;
            return { title: d.name || "Untitled certificate", sub: d.issuer || "" };
          }}
        />
      );
    case "custom":
      return (
        <ItemsList
          block={block}
          resumeId={resumeId}
          ItemForm={CustomItem}
          summary={(i) => {
            const d = i.data as ResolvedCustomItem;
            return { title: d.title || "Untitled", sub: "" };
          }}
        />
      );
    default:
      return (
        <p className="text-[12px] text-[var(--on-surface-muted)]">
          Edit this section on the canvas.
        </p>
      );
  }
}

// ============================================================
// Summary — single textarea
// ============================================================

function SummaryEditor({ block, resumeId }: { block: ResolvedBlock; resumeId: string }) {
  const run = useTrackedAction();
  const { patchSummary } = useResumeState();
  const item = block.items[0];
  const initial = (item?.data as { text?: string } | undefined)?.text ?? "";
  return (
    <Field
      value={initial}
      placeholder="A short positioning paragraph — what you do, for whom, and with what edge."
      multiline
      rows={4}
      autoSize
      onLive={patchSummary}
      onSave={(v) => run(() => updateSummary(resumeId, v))}
    />
  );
}

// ============================================================
// Generic items list — collapsible per item + "Add" CTA
// ============================================================

function ItemsList({
  block,
  resumeId,
  ItemForm,
  summary,
}: {
  block: ResolvedBlock;
  resumeId: string;
  ItemForm: React.ComponentType<{ item: ResolvedBlockItem; resumeId: string }>;
  summary: (i: ResolvedBlockItem) => { title: string; sub?: string };
}) {
  const run = useTrackedAction();
  const meta = useSectionMeta()[block.type];
  const [items, setItems] = useState(block.items);

  useEffect(() => setItems(block.items), [block.items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    run(() =>
      reorderItems(
        resumeId,
        block.id,
        next.map((i) => i.id),
      ),
    );
  };

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <CollapsibleItem
              key={item.id}
              item={item}
              resumeId={resumeId}
              ItemForm={ItemForm}
              summary={summary(item)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={() => run(() => addItemToBlock(resumeId, block.id))}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--magic-1)] transition-opacity hover:opacity-80 dark:text-[var(--magic-2)]"
      >
        <Plus className="h-3.5 w-3.5" />
        {meta.addLabel || "Add item"}
      </button>
    </div>
  );
}

function CollapsibleItem({
  item,
  resumeId,
  ItemForm,
  summary,
}: {
  item: ResolvedBlockItem;
  resumeId: string;
  ItemForm: React.ComponentType<{ item: ResolvedBlockItem; resumeId: string }>;
  summary: { title: string; sub?: string };
}) {
  const [open, setOpen] = useState(false);
  const run = useTrackedAction();
  const confirm = useConfirm();
  const T = useT();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/item overflow-hidden rounded-[10px] bg-[var(--surface-sunk)] shadow-[inset_0_0_0_1px_var(--border-ghost)]",
        isDragging && "shadow-[inset_0_0_0_1px_var(--magic-2),var(--sh-2)] opacity-90",
      )}
    >
      <div className="flex items-center gap-1.5 px-2 py-2.5">
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="cursor-grab touch-none rounded p-0.5 text-[var(--on-surface-faint)] opacity-0 transition-opacity hover:text-[var(--on-surface-muted)] group-hover/item:opacity-100"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-[var(--on-surface)]">
              {summary.title}
            </span>
            {summary.sub && (
              <span className="block truncate text-[11px] text-[var(--on-surface-muted)]">
                {summary.sub}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={async () => {
            const ok = await confirm({
              title: `${T("ce.confirm.remove_item.title")} (${summary.title})`,
              description: T("ce.confirm.remove_item.desc"),
              confirmLabel: T("ce.confirm.remove_item.cta"),
              destructive: true,
            });
            if (ok) run(() => removeItemFromBlock(resumeId, item.id));
          }}
          aria-label={T("common.remove")}
          className="rounded p-1 text-[var(--on-surface-muted)] opacity-0 transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--destructive)] group-hover/item:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Collapse" : "Expand"}
          className="rounded p-1 text-[var(--on-surface-muted)] transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <div className="space-y-2.5 border-t border-[var(--border-ghost)] p-3">
          <ItemForm item={item} resumeId={resumeId} />
        </div>
      )}
    </div>
  );
}

// -------- Experience --------
function ExperienceItem({ item, resumeId }: { item: ResolvedBlockItem; resumeId: string }) {
  const data = item.data as ResolvedExperience;
  const run = useTrackedAction();
  const { patchItemField } = useResumeState();
  const save = (field: string) => (v: string) =>
    run(() => updateItemField(resumeId, item.id, field, v || null));
  const live = (field: string) => (v: string) =>
    patchItemField(item.id, field, v === "" ? null : v);
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Title" value={data.title ?? ""} onLive={live("title")} onSave={save("title")} />
        <Field label="Company" value={data.company ?? ""} onLive={live("company")} onSave={save("company")} />
      </div>
      <Field
        label="Location"
        value={data.location ?? ""}
        placeholder="Remote"
        onLive={live("location")}
        onSave={save("location")}
      />
      <div className="grid grid-cols-2 gap-2.5">
        <Field
          label="Start"
          type="month"
          value={(data.startDate ?? "").slice(0, 7)}
          onLive={live("startDate")}
          onSave={save("startDate")}
        />
        <Field
          label={data.isCurrent ? "End (current)" : "End"}
          type="month"
          value={(data.endDate ?? "").slice(0, 7)}
          onLive={live("endDate")}
          onSave={save("endDate")}
        />
      </div>
      <BulletsEditor
        itemId={item.id}
        resumeId={resumeId}
        bullets={data.bullets ?? []}
      />
    </>
  );
}

// -------- Education --------
function EducationItem({ item, resumeId }: { item: ResolvedBlockItem; resumeId: string }) {
  const data = item.data as ResolvedEducation;
  const run = useTrackedAction();
  const { patchItemField } = useResumeState();
  const save = (field: string) => (v: string) =>
    run(() => updateItemField(resumeId, item.id, field, v || null));
  const live = (field: string) => (v: string) =>
    patchItemField(item.id, field, v === "" ? null : v);
  return (
    <>
      <Field label="Institution" value={data.institution ?? ""} onLive={live("institution")} onSave={save("institution")} />
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Degree" value={data.degree ?? ""} onLive={live("degree")} onSave={save("degree")} />
        <Field
          label="Field of study"
          value={data.fieldOfStudy ?? ""}
          onLive={live("fieldOfStudy")}
          onSave={save("fieldOfStudy")}
        />
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        <Field label="Start" type="month" value={(data.startDate ?? "").slice(0, 7)} onLive={live("startDate")} onSave={save("startDate")} />
        <Field label="End" type="month" value={(data.endDate ?? "").slice(0, 7)} onLive={live("endDate")} onSave={save("endDate")} />
        <Field label="GPA" value={data.gpa ?? ""} placeholder="3.8" onLive={live("gpa")} onSave={save("gpa")} />
      </div>
      <Field
        label="Notes"
        value={data.description ?? ""}
        placeholder="Honors, relevant coursework…"
        multiline
        autoSize
        onLive={live("description")}
        onSave={save("description")}
      />
    </>
  );
}

// -------- Skills --------
function SkillItem({ item, resumeId }: { item: ResolvedBlockItem; resumeId: string }) {
  const data = item.data as ResolvedSkill;
  const run = useTrackedAction();
  const { patchItemField } = useResumeState();
  const save = (field: string) => (v: string) =>
    run(() => updateItemField(resumeId, item.id, field, v || null));
  const live = (field: string) => (v: string) =>
    patchItemField(item.id, field, v === "" ? null : v);
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Field label="Skill" value={data.name ?? ""} placeholder="React" onLive={live("name")} onSave={save("name")} />
      <Field
        label="Category"
        value={data.category ?? ""}
        placeholder="Frontend"
        onLive={live("category")}
        onSave={save("category")}
      />
    </div>
  );
}

// -------- Projects --------
function ProjectItem({ item, resumeId }: { item: ResolvedBlockItem; resumeId: string }) {
  const data = item.data as ResolvedProject;
  const run = useTrackedAction();
  const { patchItemField } = useResumeState();
  const save = (field: string) => (v: string) =>
    run(() => updateItemField(resumeId, item.id, field, v || null));
  const live = (field: string) => (v: string) =>
    patchItemField(item.id, field, v === "" ? null : v);
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Project" value={data.name ?? ""} onLive={live("name")} onSave={save("name")} />
        <Field label="Link" value={data.url ?? ""} placeholder="https://…" onLive={live("url")} onSave={save("url")} />
      </div>
      <Field
        label="Description"
        value={data.description ?? ""}
        placeholder="What it is in one line."
        multiline
        autoSize
        onLive={live("description")}
        onSave={save("description")}
      />
      <BulletsEditor
        itemId={item.id}
        resumeId={resumeId}
        bullets={data.bullets ?? []}
      />
    </>
  );
}

// -------- Certifications --------
function CertificationItem({ item, resumeId }: { item: ResolvedBlockItem; resumeId: string }) {
  const data = item.data as ResolvedCertification;
  const run = useTrackedAction();
  const { patchItemField } = useResumeState();
  const save = (field: string) => (v: string) =>
    run(() => updateItemField(resumeId, item.id, field, v || null));
  const live = (field: string) => (v: string) =>
    patchItemField(item.id, field, v === "" ? null : v);
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Name" value={data.name ?? ""} onLive={live("name")} onSave={save("name")} />
        <Field label="Issuer" value={data.issuer ?? ""} onLive={live("issuer")} onSave={save("issuer")} />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Issued" type="month" value={(data.issueDate ?? "").slice(0, 7)} onLive={live("issueDate")} onSave={save("issueDate")} />
        <Field label="Expires" type="month" value={(data.expiryDate ?? "").slice(0, 7)} onLive={live("expiryDate")} onSave={save("expiryDate")} />
      </div>
      <Field
        label="Credential URL"
        value={data.credentialUrl ?? ""}
        placeholder="https://…"
        onLive={live("credentialUrl")}
        onSave={save("credentialUrl")}
      />
    </>
  );
}

// -------- Custom --------
function CustomItem({ item, resumeId }: { item: ResolvedBlockItem; resumeId: string }) {
  const data = item.data as ResolvedCustomItem;
  const run = useTrackedAction();
  const { patchItemField } = useResumeState();
  const save = (field: string) => (v: string) =>
    run(() => updateItemField(resumeId, item.id, field, v || null));
  const live = (field: string) => (v: string) =>
    patchItemField(item.id, field, v === "" ? null : v);
  return (
    <>
      <Field label="Title" value={data.title ?? ""} onLive={live("title")} onSave={save("title")} />
      <Field
        label="Body"
        value={data.text ?? ""}
        multiline
        autoSize
        rows={3}
        onLive={live("text")}
        onSave={save("text")}
      />
    </>
  );
}

// ============================================================
// Bullets editor
// ============================================================

function BulletsEditor({
  itemId,
  resumeId,
  bullets,
}: {
  itemId: string;
  resumeId: string;
  bullets: ResolvedBullet[];
}) {
  const run = useTrackedAction();
  const { patchBullet } = useResumeState();
  const [localBullets, setLocalBullets] = useState(bullets);

  useEffect(() => setLocalBullets(bullets), [bullets]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = localBullets.findIndex((b) => b.id === active.id);
    const newIndex = localBullets.findIndex((b) => b.id === over.id);
    const next = arrayMove(localBullets, oldIndex, newIndex);
    setLocalBullets(next);
    run(() =>
      reorderBullets(
        resumeId,
        itemId,
        next.map((b) => b.id),
      ),
    );
  };

  return (
    <div>
      <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[var(--on-surface-muted)]">
        <span>Bullets</span>
        <span className="font-mono text-[10px] text-[var(--on-surface-faint)]">
          {localBullets.length}
        </span>
      </span>
      <div className="space-y-1.5">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localBullets.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            {localBullets.map((b) => (
              <SortableBullet
                key={b.id}
                bullet={b}
                itemId={itemId}
                resumeId={resumeId}
              />
            ))}
          </SortableContext>
        </DndContext>
        <button
          onClick={() => run(() => addBulletToItem(resumeId, itemId))}
          className="inline-flex items-center gap-1 text-[12px] text-[var(--magic-1)] opacity-70 transition-opacity hover:opacity-100 dark:text-[var(--magic-2)]"
        >
          <Plus className="h-3 w-3" />
          Add bullet
        </button>
      </div>
    </div>
  );
}

function SortableBullet({
  bullet,
  itemId,
  resumeId,
}: {
  bullet: ResolvedBullet;
  itemId: string;
  resumeId: string;
}) {
  const run = useTrackedAction();
  const { patchBullet } = useResumeState();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bullet.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/bullet relative flex items-start gap-1",
        isDragging && "opacity-90",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder bullet"
        className="mt-2.5 cursor-grab touch-none rounded p-0.5 text-[var(--on-surface-faint)] opacity-0 transition-opacity hover:text-[var(--on-surface-muted)] group-hover/bullet:opacity-100"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <div className="min-w-0 flex-1">
        <Field
          value={bullet.text}
          placeholder="Shipped X, which led to Y…"
          multiline
          autoSize
          rows={2}
          onLive={(v) => patchBullet(itemId, bullet.id, v)}
          onSave={(v) => run(() => updateBulletText(resumeId, itemId, bullet.id, v))}
        />
      </div>
      <button
        onClick={() => run(() => deleteBullet(resumeId, itemId, bullet.id))}
        aria-label="Delete bullet"
        className="mt-2 rounded p-1 text-[var(--on-surface-muted)] opacity-0 transition-colors hover:bg-[var(--surface)] hover:text-[var(--destructive)] group-hover/bullet:opacity-100"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
