"use client";

import { InteractiveResume } from "./interactive-resume";
import { useResumeState } from "./resume-state";

/**
 * Reads resume state from the shared optimistic context so typing in the
 * left-side ContentEditor updates the preview on every keystroke (before
 * the server save completes).
 */
export function ResumePreview() {
  const { resume } = useResumeState();
  return (
    <div className="rounded-lg bg-[var(--surface-container-lowest)] shadow-ambient overflow-auto">
      <InteractiveResume resume={resume} />
    </div>
  );
}
