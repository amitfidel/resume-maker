"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Sparkles, Target } from "lucide-react";
import { BlockList } from "./block-list";
import { TemplatePicker } from "./template-picker";
import { ResumePreview } from "./resume-preview";
import { AiReviewPanel } from "./ai-review-panel";
import { JobTailorPanel } from "./job-tailor-panel";
import { Separator } from "@/components/ui/separator";
import type { ResolvedResume } from "@/lib/resume/types";

type RightPanel = "none" | "ai-review" | "job-tailor";

type Props = {
  resume: ResolvedResume;
};

export function EditorShell({ resume }: Props) {
  const [rightPanel, setRightPanel] = useState<RightPanel>("none");

  const togglePanel = (panel: RightPanel) => {
    setRightPanel((prev) => (prev === panel ? "none" : panel));
  };

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href="/resumes">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">{resume.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={rightPanel === "job-tailor" ? "default" : "outline"}
            size="sm"
            onClick={() => togglePanel("job-tailor")}
          >
            <Target className="mr-2 h-4 w-4" />
            Tailor for Job
          </Button>
          <Button
            variant={rightPanel === "ai-review" ? "default" : "outline"}
            size="sm"
            onClick={() => togglePanel("ai-review")}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            AI Review
          </Button>
          <a href={`/api/pdf/${resume.id}`} download>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </a>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - block controls */}
        <aside className="w-72 shrink-0 overflow-y-auto border-r p-4 space-y-4">
          <BlockList resumeId={resume.id} blocks={resume.blocks} />
          <Separator />
          <TemplatePicker resumeId={resume.id} currentTemplateId={resume.templateId} />
        </aside>

        {/* Center - resume preview */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <ResumePreview resume={resume} />
        </main>

        {/* Right panels */}
        {rightPanel === "ai-review" && (
          <AiReviewPanel
            resumeId={resume.id}
            onClose={() => setRightPanel("none")}
          />
        )}
        {rightPanel === "job-tailor" && (
          <JobTailorPanel
            resumeId={resume.id}
            onClose={() => setRightPanel("none")}
          />
        )}
      </div>
    </div>
  );
}
