"use client";

import type { ResolvedResume } from "@/lib/resume/types";
import { InteractiveResume } from "./interactive-resume";

type Props = {
  resume: ResolvedResume;
};

export function ResumePreview({ resume }: Props) {
  return (
    <div className="rounded-lg border shadow-sm overflow-auto">
      <InteractiveResume resume={resume} />
    </div>
  );
}
