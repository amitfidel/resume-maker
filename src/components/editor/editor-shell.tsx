"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Sparkles, Target, MessageCircle } from "lucide-react";
import { ContentEditor } from "./content-editor";
import { TemplateDialog } from "./template-dialog";
import { ResumePreview } from "./resume-preview";
import { ResumeStateProvider } from "./resume-state";
import { AiReviewPanel } from "./ai-review-panel";
import { JobTailorPanel } from "./job-tailor-panel";
import { AiChatPanel } from "./ai-chat-panel";
import { VersionHistory } from "./version-history";
import { SaveVersionButton } from "./save-version-button";
import { SaveIndicator } from "./save-indicator";
import { TemplateRenderer } from "@/templates/renderer";
import { useT, useI18n } from "@/lib/i18n/context";
import type { ResolvedResume } from "@/lib/resume/types";

type RightPanel = "none" | "ai-review" | "job-tailor" | "ai-chat";
type ViewTab = "editor" | "preview" | "history";

type Props = {
  resume: ResolvedResume;
};

export function EditorShell({ resume }: Props) {
  const [rightPanel, setRightPanel] = useState<RightPanel>("none");
  const [activeTab, setActiveTab] = useState<ViewTab>("editor");
  const router = useRouter();
  const t = useT();
  const { locale } = useI18n();

  const togglePanel = (panel: RightPanel) => {
    setRightPanel((prev) => (prev === panel ? "none" : panel));
  };

  // Hide side panels and sidebars when in preview or history mode
  const showSidebars = activeTab === "editor";

  return (
    <ResumeStateProvider initialResume={resume}>
    <div className="flex h-[calc(100vh-0px)] flex-col bg-[var(--surface)]">
      {/* Editor toolbar - glass effect */}
      <div className="glass-effect sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[var(--border-ghost)] px-5">
        <div className="flex min-w-0 items-center gap-3.5">
          <Link href="/resumes">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-[10px] text-[var(--on-surface-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="font-headline rounded-md px-2 py-1 text-[18px] tracking-[-0.01em] text-[var(--on-surface)] transition-colors hover:bg-[var(--surface-sunk)]">
            {resume.title === "Untitled Resume" ? t("editor.untitled") : resume.title}
          </h1>
          <SaveIndicator />
          <div className="ms-2 inline-flex rounded-full bg-[var(--surface-sunk)] p-[3px]">
            {(["editor", "preview", "history"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-[var(--t-mid)] ease-[var(--ease-out)] ${
                  activeTab === tab
                    ? "bg-[var(--surface-raised)] text-[var(--on-surface)] shadow-[var(--sh-1)]"
                    : "text-[var(--on-surface-muted)] hover:text-[var(--on-surface-soft)]"
                }`}
              >
                {t(`editor.tab.${tab}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showSidebars && (
            <>
              <TemplateDialog resumeId={resume.id} currentTemplateId={resume.templateId} />
              <SaveVersionButton resumeId={resume.id} />
              <Button
                size="sm"
                onClick={() => togglePanel("ai-chat")}
                className={rightPanel === "ai-chat"
                  ? "magical-surface gap-2 rounded-full"
                  : "magical-gradient magic-shine gap-2 rounded-full"
                }
              >
                <MessageCircle className="h-4 w-4" />
                {t("editor.ai_chat")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => togglePanel("job-tailor")}
                className={
                  rightPanel === "job-tailor"
                    ? "magical-gradient gap-2 rounded-full"
                    : "h-9 gap-1.5 rounded-full text-[13px] text-[var(--on-surface-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
                }
              >
                <Target className="h-3.5 w-3.5" />
                {t("editor.tailor")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => togglePanel("ai-review")}
                className={
                  rightPanel === "ai-review"
                    ? "magical-gradient gap-2 rounded-full"
                    : "h-9 gap-1.5 rounded-full text-[13px] text-[var(--on-surface-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
                }
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t("editor.review")}
              </Button>
            </>
          )}
          <a href={`/api/pdf/${resume.id}?locale=${locale}`} download>
            <Button
              size="sm"
              className="magic-shine h-9 gap-2 rounded-full bg-[var(--ink)] px-4 text-[var(--cream)] hover:-translate-y-px hover:bg-[var(--ink)]"
            >
              {t("common.export")}
              <Download className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </div>

      {/* Editor body - changes based on active tab */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === "editor" && (
          <>
            {/* Left — form-style content editor */}
            <ContentEditor />

            {/* Center — live resume canvas (still inline-editable) */}
            <main className="flex-1 overflow-y-auto bg-[var(--surface-sunk)] p-8">
              <div className="mx-auto max-w-[820px]">
                <ResumePreview />
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
            {rightPanel === "ai-chat" && (
              <AiChatPanel
                resumeId={resume.id}
                onClose={() => setRightPanel("none")}
              />
            )}
          </>
        )}

        {activeTab === "preview" && (
          <main className="flex-1 overflow-y-auto bg-[var(--surface-container)] p-12">
            <div className="mx-auto max-w-[820px]">
              <div className="rounded-lg bg-white shadow-ambient overflow-hidden">
                <TemplateRenderer resume={resume} />
              </div>
              <p className="mt-6 text-center text-xs text-[var(--on-surface-variant)]">
                This is how your resume will look when exported. No edit handles, no hover states — just the final document.
              </p>
            </div>
          </main>
        )}

        {activeTab === "history" && (
          <main className="flex-1 overflow-y-auto bg-[var(--surface-container)] p-12">
            <VersionHistory
              resumeId={resume.id}
              onRestoreComplete={() => {
                setActiveTab("editor");
                router.refresh();
              }}
            />
          </main>
        )}
      </div>
    </div>
    </ResumeStateProvider>
  );
}
