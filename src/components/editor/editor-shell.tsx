"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Sparkles, Target, Share2 } from "lucide-react";
import { BlockList } from "./block-list";
import { TemplatePicker } from "./template-picker";
import { ResumePreview } from "./resume-preview";
import { AiReviewPanel } from "./ai-review-panel";
import { JobTailorPanel } from "./job-tailor-panel";
import type { ResolvedResume } from "@/lib/resume/types";

type RightPanel = "none" | "ai-review" | "job-tailor";

type Props = {
  resume: ResolvedResume;
};

export function EditorShell({ resume }: Props) {
  const [rightPanel, setRightPanel] = useState<RightPanel>("none");
  const [activeTab, setActiveTab] = useState<"editor" | "preview" | "history">("editor");

  const togglePanel = (panel: RightPanel) => {
    setRightPanel((prev) => (prev === panel ? "none" : panel));
  };

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col bg-[var(--surface)]">
      {/* Editor toolbar - glass effect */}
      <div className="glass-effect flex items-center justify-between border-b border-ghost px-4 py-2.5 z-10">
        <div className="flex items-center gap-4">
          <Link href="/resumes">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--on-surface-variant)]">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="font-headline text-base font-bold text-[var(--on-surface)]">
            Architect Editor
          </h1>
          <div className="flex items-center gap-1 ml-2">
            {(["editor", "preview", "history"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                  activeTab === tab
                    ? "text-[var(--on-surface)] bg-[var(--surface-container)]"
                    : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={rightPanel === "job-tailor" ? "default" : "ghost"}
            size="sm"
            onClick={() => togglePanel("job-tailor")}
            className={rightPanel === "job-tailor" ? "magical-gradient text-white" : "text-[var(--on-surface-variant)]"}
          >
            <Target className="mr-2 h-4 w-4" />
            Job Tailor
          </Button>
          <Button
            size="sm"
            onClick={() => togglePanel("ai-review")}
            className={rightPanel === "ai-review"
              ? "magical-surface text-white"
              : "magical-gradient text-white"
            }
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Magic AI
          </Button>
          <a href={`/api/pdf/${resume.id}`} download>
            <Button size="sm" className="bg-[var(--on-surface)] text-white hover:bg-[var(--on-surface)]/90 gap-2">
              Export
              <Download className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - sections + template */}
        <aside className="w-64 shrink-0 overflow-y-auto bg-[var(--surface-container-lowest)] p-5 space-y-6">
          <BlockList resumeId={resume.id} blocks={resume.blocks} />
          <Separator className="bg-[var(--surface-container-high)]" />
          <TemplatePicker resumeId={resume.id} currentTemplateId={resume.templateId} />
        </aside>

        {/* Center - resume canvas on tonal background */}
        <main className="flex-1 overflow-y-auto bg-[var(--surface-container)] p-8">
          <div className="mx-auto max-w-[820px]">
            <ResumePreview resume={resume} />
          </div>
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
