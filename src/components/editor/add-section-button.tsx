"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  BookOpen,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award,
  FileText,
  Sparkles,
  Check,
} from "lucide-react";
import {
  addStandardSection,
  addCustomSection,
} from "@/app/(dashboard)/resumes/actions";
import type { BlockType } from "@/lib/resume/types";

type SectionOption = {
  type: BlockType;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
};

/**
 * Suggested sections, in the order a resume typically reads. The editor
 * surfaces the *missing* ones at the top, then shows already-added ones
 * greyed out below. Header/Personal Details is always present.
 */
const SECTION_OPTIONS: SectionOption[] = [
  {
    type: "summary",
    label: "Profile summary",
    hint: "A short positioning paragraph",
    icon: BookOpen,
  },
  {
    type: "experience",
    label: "Work experience",
    hint: "Roles, companies, impact",
    icon: Briefcase,
  },
  {
    type: "education",
    label: "Education",
    hint: "Schools, degrees, coursework",
    icon: GraduationCap,
  },
  {
    type: "skills",
    label: "Skills",
    hint: "Tools, languages, methods",
    icon: Wrench,
  },
  {
    type: "projects",
    label: "Projects",
    hint: "Side builds, open source, portfolio",
    icon: FolderGit2,
  },
  {
    type: "certifications",
    label: "Certifications",
    hint: "Credentials and licenses",
    icon: Award,
  },
];

type Props = {
  resumeId: string;
  existingBlockTypes: string[];
};

export function AddSectionButton({ resumeId, existingBlockTypes }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [customHeading, setCustomHeading] = useState("");
  const [isPending, start] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const missing = SECTION_OPTIONS.filter((o) => !existingBlockTypes.includes(o.type));
  const added = SECTION_OPTIONS.filter((o) => existingBlockTypes.includes(o.type));

  const runAction = (fn: () => Promise<void>) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("resumi:save-start"));
    }
    start(async () => {
      try {
        await fn();
        router.refresh();
        setOpen(false);
        setCustomHeading("");
      } finally {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("resumi:save-end"));
        }
      }
    });
  };

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(t) &&
        buttonRef.current &&
        !buttonRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const t = setTimeout(() => {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }, 10);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[var(--surface-sunk)] px-4 py-2.5 text-[13px] font-medium text-[var(--on-surface-soft)] transition-colors hover:bg-[var(--magic-tint)] hover:text-[var(--magic-1)]"
      >
        <Plus className="h-3.5 w-3.5" />
        Add section
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute left-0 right-0 top-full z-30 mt-2 rounded-[16px] bg-[var(--surface-raised)] p-2 shadow-[var(--sh-4),0_0_0_1px_var(--border-ghost)]"
          style={{ animation: "section-pop 200ms var(--ease-spring)" }}
        >
          <style>{`
            @keyframes section-pop {
              from { opacity: 0; transform: translateY(-4px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {missing.length > 0 && (
            <>
              <p className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                <Sparkles className="h-3 w-3" />
                Suggested — add what&apos;s missing
              </p>
              <div className="space-y-0.5 pb-1">
                {missing.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => runAction(() => addStandardSection(resumeId, opt.type))}
                    disabled={isPending}
                    className="flex w-full items-start gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-sunk)] disabled:opacity-50"
                  >
                    <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-[8px] bg-[var(--magic-tint)] text-[var(--magic-1)]">
                      <opt.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-[13px] font-medium text-[var(--on-surface)]">
                        {opt.label}
                      </span>
                      <span className="block text-[11px] text-[var(--on-surface-muted)]">
                        {opt.hint}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {added.length > 0 && (
            <>
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                Already in your resume
              </p>
              <div className="space-y-0.5 pb-1">
                {added.map((opt) => (
                  <div
                    key={opt.type}
                    className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-[var(--on-surface-faint)]"
                  >
                    <span className="grid h-7 w-7 flex-none place-items-center rounded-[8px] bg-[var(--surface-sunk)]">
                      <opt.icon className="h-3 w-3" />
                    </span>
                    <span className="flex-1 text-[12px]">{opt.label}</span>
                    <Check className="h-3 w-3 text-[var(--success)]" />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Custom section */}
          <div className="mt-1 rounded-[10px] bg-[var(--surface-sunk)] p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
              <FileText className="h-3 w-3" />
              Custom section
            </p>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customHeading}
                onChange={(e) => setCustomHeading(e.target.value)}
                placeholder="e.g. Awards, Volunteering, Languages"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customHeading.trim()) {
                    e.preventDefault();
                    runAction(() => addCustomSection(resumeId, customHeading.trim()));
                  }
                }}
                className="flex-1 rounded-[8px] bg-[var(--surface-raised)] px-3 py-2 text-[13px] outline-none shadow-[inset_0_0_0_1px_var(--border-ghost)] placeholder:text-[var(--on-surface-faint)] focus:shadow-[inset_0_0_0_2px_var(--magic-2)]"
              />
              <button
                onClick={() =>
                  customHeading.trim() &&
                  runAction(() => addCustomSection(resumeId, customHeading.trim()))
                }
                disabled={!customHeading.trim() || isPending}
                className="rounded-[8px] bg-[var(--ink)] px-4 py-2 text-[13px] font-medium text-[var(--cream)] transition-opacity disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
