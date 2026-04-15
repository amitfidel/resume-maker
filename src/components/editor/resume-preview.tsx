"use client";

import type { ResolvedResume } from "@/lib/resume/types";
import { InteractiveResume } from "./interactive-resume";

type Props = {
  resume: ResolvedResume;
};

export function ResumePreview({ resume }: Props) {
  return (
    <div className="rounded-lg bg-[var(--surface-container-lowest)] shadow-ambient overflow-auto">
      <InteractiveResume resume={resume} />
    </div>
  );
}
