"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useT } from "@/lib/i18n/context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  History,
  RotateCcw,
  Eye,
  Trash2,
  User,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  getResumeVersions,
  restoreResumeVersion,
  deleteResumeVersion,
  getResolvedVersion,
} from "@/app/(dashboard)/resumes/actions";
import { TemplateRenderer } from "@/templates/renderer";
import type { ResumeVersion } from "@/db/schema";
import type { ResolvedResume } from "@/lib/resume/types";

type Props = {
  resumeId: string;
  onRestoreComplete?: () => void;
};

export function VersionHistory({ resumeId, onRestoreComplete }: Props) {
  const [versions, setVersions] = useState<ResumeVersion[] | null>(null);
  const [previewVersion, setPreviewVersion] = useState<ResumeVersion | null>(null);
  const [resolvedPreview, setResolvedPreview] = useState<ResolvedResume | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();
  const t = useT();

  const loadVersions = useCallback(async () => {
    const v = await getResumeVersions(resumeId);
    setVersions(v);
  }, [resumeId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // When a version is selected for preview, fetch the resolved version
  useEffect(() => {
    if (!previewVersion) {
      setResolvedPreview(null);
      return;
    }
    let cancelled = false;
    setLoadingPreview(true);
    getResolvedVersion(resumeId, previewVersion.id).then((r) => {
      if (!cancelled) {
        setResolvedPreview(r);
        setLoadingPreview(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [previewVersion, resumeId]);

  const handleRestore = useCallback(
    async (versionId: string, versionNumber: number) => {
      const ok = await confirm({
        title: `${t("history.confirm.restore.title")} ${versionNumber}?`,
        description: t("history.confirm.restore.desc"),
        confirmLabel: t("history.confirm.restore.cta"),
      });
      if (!ok) return;

      startTransition(async () => {
        const result = await restoreResumeVersion(resumeId, versionId);
        if (result?.error) {
          alert(`Error: ${result.error}`);
        } else {
          await loadVersions();
          onRestoreComplete?.();
        }
      });
    },
    [resumeId, loadVersions, onRestoreComplete, confirm]
  );

  const handleDelete = useCallback(
    async (versionId: string, versionNumber: number) => {
      const ok = await confirm({
        title: `${t("history.confirm.delete.title")} ${versionNumber}?`,
        description: t("history.confirm.delete.desc"),
        confirmLabel: t("history.confirm.delete.cta"),
        destructive: true,
      });
      if (!ok) return;

      startTransition(async () => {
        await deleteResumeVersion(resumeId, versionId);
        await loadVersions();
      });
    },
    [resumeId, loadVersions, confirm]
  );

  if (versions === null) {
    return (
      <div className="mx-auto max-w-[600px] py-12 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--on-surface-variant)]" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="mx-auto max-w-[600px] text-center">
        <div className="resumi-card p-12">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[14px] bg-[var(--surface-sunk)]">
            <History className="h-6 w-6 text-[var(--on-surface-muted)]" />
          </div>
          <h2 className="font-headline text-[24px] font-normal tracking-[-0.015em] text-[var(--on-surface)]">
            {t("history.empty.title.part1")}{" "}
            <em className="serif-ital">{t("history.empty.title.italic")}</em>
          </h2>
          <p className="mt-2 text-sm text-[var(--on-surface-variant)]">
            {t("history.empty.lead")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px]">
      <div className="mb-6">
        <h2 className="font-headline text-2xl font-bold text-[var(--on-surface)]">
          Version History
        </h2>
        <p className="mt-1 text-sm text-[var(--on-surface-variant)]">
          {versions.length} version{versions.length !== 1 ? "s" : ""} saved.
          Click any version to preview or restore.
        </p>
      </div>

      <div className="space-y-3">
        {versions.map((v) => (
          <VersionCard
            key={v.id}
            version={v}
            onPreview={() => setPreviewVersion(v)}
            onRestore={() => handleRestore(v.id, v.versionNumber)}
            onDelete={() => handleDelete(v.id, v.versionNumber)}
            isPending={isPending}
          />
        ))}
      </div>

      {/* Version preview dialog - renders the actual resume */}
      <Dialog
        open={!!previewVersion}
        onOpenChange={(open) => !open && setPreviewVersion(null)}
      >
        <DialogContent className="sm:!max-w-[920px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline">
              Version {previewVersion?.versionNumber}
              {previewVersion?.changeSummary && ` — ${previewVersion.changeSummary}`}
            </DialogTitle>
            <div className="flex items-center gap-3 text-xs text-[var(--on-surface-variant)]">
              <span>
                {previewVersion?.createdBy === "ai_tailoring" ? t("history.by_ai") : t("history.by_you")}
              </span>
              <span>•</span>
              <span>
                {previewVersion &&
                  new Date(previewVersion.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
              </span>
            </div>
          </DialogHeader>

          <div className="bg-[var(--surface-container-low)] rounded-lg p-6 -mx-1">
            {loadingPreview && (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--on-surface-variant)]" />
              </div>
            )}
            {!loadingPreview && resolvedPreview && (
              <div className="bg-white rounded-md shadow-sm overflow-hidden">
                <TemplateRenderer resume={resolvedPreview} />
              </div>
            )}
            {!loadingPreview && !resolvedPreview && (
              <p className="text-center text-sm text-[var(--on-surface-variant)] py-12">
                {t("history.preview.failed")}
              </p>
            )}
          </div>

          {previewVersion && (
            <div className="flex gap-2 border-t border-ghost pt-4">
              <Button
                onClick={() => {
                  handleRestore(previewVersion.id, previewVersion.versionNumber);
                  setPreviewVersion(null);
                }}
                className="magical-gradient text-white"
                disabled={isPending}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {t("history.restore")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPreviewVersion(null)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VersionCard({
  version,
  onPreview,
  onRestore,
  onDelete,
  isPending,
}: {
  version: ResumeVersion;
  onPreview: () => void;
  onRestore: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const isAi = version.createdBy === "ai_tailoring";
  const t = useT();

  return (
    <div className="resumi-card p-4 transition-all hover:shadow-[var(--sh-3)]">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-container)]">
          <span className="font-headline text-sm font-bold text-[var(--on-surface)]">
            v{version.versionNumber}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[var(--on-surface)]">
                {version.changeSummary || t("history.untitled")}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-[var(--on-surface-variant)]">
                <span className="inline-flex items-center gap-1">
                  {isAi ? (
                    <Sparkles className="h-3 w-3 text-[var(--tertiary)]" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  {isAi ? t("history.by_ai") : t("history.by_you")}
                </span>
                <span>•</span>
                <span>{formatRelative(version.createdAt)}</span>
              </div>
            </div>
            {isAi && (
              <Badge
                variant="secondary"
                className="bg-[var(--tertiary-fixed)] text-[var(--tertiary)] text-xs"
              >
                AI
              </Badge>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreview}
              className="h-7 text-xs gap-1"
              disabled={isPending}
            >
              <Eye className="h-3 w-3" />
              {t("history.preview")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRestore}
              className="h-7 text-xs gap-1 text-[var(--tertiary)] hover:text-[var(--tertiary)]"
              disabled={isPending}
            >
              <RotateCcw className="h-3 w-3" />
              {t("history.restore")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-7 text-xs gap-1 text-[var(--on-surface-variant)] hover:text-[var(--destructive)]"
              disabled={isPending}
            >
              <Trash2 className="h-3 w-3" />
              {t("history.delete")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
