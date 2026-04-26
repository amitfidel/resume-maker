"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  LayoutTemplate,
  Bookmark,
  Share2,
  Check,
  Loader2,
} from "lucide-react";
import { TemplatePicker } from "./template-picker";
import { saveResumeVersion } from "@/app/(dashboard)/resumes/actions";
import { useT, useI18n } from "@/lib/i18n/context";

/**
 * Combined "More actions" overflow menu for the editor toolbar.
 *
 * Three buttons used to live as peers in the toolbar — Templates,
 * Save Version, Share — and started colliding with the tab pill once
 * we added a 4th tab (Cover Letter). Folding them into a single
 * dropdown frees about 220px of horizontal space and makes the
 * toolbar fit on a normal laptop without responsive gymnastics.
 *
 * This component owns its own dialog state so the parent toolbar
 * doesn't need to thread anything through. The Templates and Save
 * Version flows reuse the existing implementations; Share copies the
 * URL inline.
 */
export function EditorActionsMenu({
  resumeId,
  currentTemplateId,
}: {
  resumeId: string;
  currentTemplateId: string;
}) {
  const t = useT();
  const { locale } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [templateOpen, setTemplateOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  const handleSaveVersion = () => {
    if (!summary.trim()) return;
    startTransition(async () => {
      await saveResumeVersion(resumeId, summary.trim());
      setSummary("");
      setSaveOpen(false);
      router.refresh();
    });
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/resume-render/${resumeId}?locale=${encodeURIComponent(locale)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2200);
    } catch {
      window.prompt("URL", url);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              title={t("editor.more")}
              aria-label={t("editor.more")}
              className="h-9 w-9 rounded-[10px] text-[var(--on-surface-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="min-w-[200px]">
          <DropdownMenuItem
            onClick={() => setTemplateOpen(true)}
            className="gap-2.5"
          >
            <LayoutTemplate className="h-4 w-4 text-[var(--on-surface-muted)]" />
            <span>{t("editor.templates")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSaveOpen(true)}
            className="gap-2.5"
          >
            <Bookmark className="h-4 w-4 text-[var(--on-surface-muted)]" />
            <span>{t("editor.save_version")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare} className="gap-2.5">
            {shareCopied ? (
              <Check className="h-4 w-4 text-[var(--success)]" />
            ) : (
              <Share2 className="h-4 w-4 text-[var(--on-surface-muted)]" />
            )}
            <span>
              {shareCopied ? t("resumes.share.copied") : t("resumes.share")}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Templates dialog — opens when the "Templates" item is clicked. */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-w-2xl rounded-[22px] border-0 bg-[var(--surface-raised)] shadow-[var(--sh-4),0_0_0_1px_var(--border-ghost)]">
          <DialogHeader>
            <DialogTitle className="font-headline text-[24px] font-normal tracking-[-0.015em]">
              {t("templates.dialog.title")}
            </DialogTitle>
            <DialogDescription className="text-[var(--on-surface-muted)]">
              {t("templates.dialog.desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <TemplatePicker
              resumeId={resumeId}
              currentTemplateId={currentTemplateId}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Save-version dialog. */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-headline">
              {t("editor.save_version.dialog_title")}
            </DialogTitle>
            <DialogDescription>
              {t("editor.save_version.dialog_desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="version-summary">
              {t("editor.save_version.label")}
            </Label>
            <Input
              id="version-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && summary.trim()) handleSaveVersion();
              }}
              placeholder={t("editor.save_version.placeholder")}
              autoFocus
              className="border-ghost"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSaveVersion}
              disabled={!summary.trim() || isPending}
              className="magical-gradient flex-1 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("editor.saving")}
                </>
              ) : (
                t("editor.save_version")
              )}
            </Button>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
