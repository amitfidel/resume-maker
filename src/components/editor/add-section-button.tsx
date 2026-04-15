"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import { Plus, Briefcase, GraduationCap, Wrench, FolderGit2, Award, FileText } from "lucide-react";
import {
  addStandardSection,
  addCustomSection,
} from "@/app/(dashboard)/resumes/actions";
import type { BlockType } from "@/lib/resume/types";

type SectionOption = {
  type: BlockType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const SECTION_OPTIONS: SectionOption[] = [
  { type: "experience", label: "Work Experience", icon: Briefcase },
  { type: "education", label: "Education", icon: GraduationCap },
  { type: "skills", label: "Skills", icon: Wrench },
  { type: "projects", label: "Projects", icon: FolderGit2 },
  { type: "certifications", label: "Certifications", icon: Award },
];

type Props = {
  resumeId: string;
  existingBlockTypes: string[];
};

export function AddSectionButton({ resumeId, existingBlockTypes }: Props) {
  const [open, setOpen] = useState(false);
  const [customHeading, setCustomHeading] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [open]);

  const handleAdd = (type: BlockType) => {
    addStandardSection(resumeId, type);
    setOpen(false);
    setShowCustomInput(false);
  };

  const handleAddCustom = () => {
    if (customHeading.trim()) {
      addCustomSection(resumeId, customHeading.trim());
      setCustomHeading("");
      setShowCustomInput(false);
      setOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        !(target as HTMLElement).closest?.("[data-section-picker]")
      ) {
        setOpen(false);
        setShowCustomInput(false);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)] hover:text-[var(--on-surface)] transition-colors w-full"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Section
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          data-section-picker
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-60 rounded-lg bg-white p-2 shadow-ambient border-ghost"
        >
          {!showCustomInput ? (
            <div className="space-y-0.5">
              <p className="px-2 py-1 text-[0.65rem] uppercase tracking-wider font-semibold text-gray-400">
                Standard sections
              </p>
              {SECTION_OPTIONS.map((opt) => {
                const existing = existingBlockTypes.includes(opt.type);
                return (
                  <button
                    key={opt.type}
                    onClick={() => handleAdd(opt.type)}
                    disabled={existing}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                      existing
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <opt.icon className="h-3.5 w-3.5" />
                    {opt.label}
                    {existing && <span className="ml-auto text-[0.65rem]">added</span>}
                  </button>
                );
              })}
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => setShowCustomInput(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                Custom Section
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="px-2 pt-1 text-[0.65rem] uppercase tracking-wider font-semibold text-gray-400">
                Section name
              </p>
              <input
                type="text"
                value={customHeading}
                onChange={(e) => setCustomHeading(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCustom();
                  if (e.key === "Escape") {
                    setShowCustomInput(false);
                    setCustomHeading("");
                  }
                }}
                autoFocus
                placeholder="e.g. Awards, Volunteering"
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <div className="flex gap-1">
                <button
                  onClick={handleAddCustom}
                  disabled={!customHeading.trim()}
                  className="flex-1 rounded-md bg-[#182034] px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomHeading("");
                  }}
                  className="rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
