"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
} from "@/app/(dashboard)/resumes/actions";
import type { ResumeVersion } from "@/db/schema";

type Props = {
  resumeId: string;
  onRestoreComplete?: () => void;
};

export function VersionHistory({ resumeId, onRestoreComplete }: Props) {
  const [versions, setVersions] = useState<ResumeVersion[] | null>(null);
  const [previewVersion, setPreviewVersion] = useState<ResumeVersion | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const loadVersions = useCallback(async () => {
    const v = await getResumeVersions(resumeId);
    setVersions(v);
  }, [resumeId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const handleRestore = useCallback(
    (versionId: string, versionNumber: number) => {
      if (
        !confirm(
          `Restore version ${versionNumber}? Your current state will be auto-saved as a new version first.`
        )
      )
        return;

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
    [resumeId, loadVersions, onRestoreComplete]
  );

  const handleDelete = useCallback(
    (versionId: string, versionNumber: number) => {
      if (!confirm(`Delete version ${versionNumber}? This cannot be undone.`))
        return;

      startTransition(async () => {
        await deleteResumeVersion(resumeId, versionId);
        await loadVersions();
      });
    },
    [resumeId, loadVersions]
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
        <div className="rounded-lg bg-white p-12 shadow-ambient">
          <History className="mx-auto mb-4 h-12 w-12 text-[var(--on-surface-variant)] opacity-40" />
          <h2 className="font-headline text-xl font-bold text-[var(--on-surface)]">
            No versions saved yet
          </h2>
          <p className="mt-2 text-sm text-[var(--on-surface-variant)]">
            Click{" "}
            <span className="inline-flex items-center gap-1 font-medium text-[var(--on-surface)]">
              Save Version
            </span>{" "}
            in the toolbar to capture a snapshot of your resume. You can then
            return to any version at any time.
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

      {/* Version preview dialog */}
      <Dialog
        open={!!previewVersion}
        onOpenChange={(open) => !open && setPreviewVersion(null)}
      >
        <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto sm:!max-w-[900px]">
          <DialogHeader>
            <DialogTitle className="font-headline">
              Version {previewVersion?.versionNumber}:{" "}
              {previewVersion?.changeSummary}
            </DialogTitle>
          </DialogHeader>
          {previewVersion && <VersionPreview version={previewVersion} />}
          {previewVersion && (
            <div className="mt-4 flex gap-2 border-t border-ghost pt-4">
              <Button
                onClick={() => {
                  handleRestore(previewVersion.id, previewVersion.versionNumber);
                  setPreviewVersion(null);
                }}
                className="magical-gradient text-white"
                disabled={isPending}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore This Version
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

  return (
    <div className="rounded-lg bg-white p-4 shadow-ambient transition-all hover:shadow-md">
      <div className="flex items-start gap-4">
        {/* Version number badge */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-container)]">
          <span className="font-headline text-sm font-bold text-[var(--on-surface)]">
            v{version.versionNumber}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[var(--on-surface)]">
                {version.changeSummary || "Untitled version"}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-[var(--on-surface-variant)]">
                <span className="inline-flex items-center gap-1">
                  {isAi ? (
                    <Sparkles className="h-3 w-3 text-[var(--tertiary)]" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  {isAi ? "AI" : "You"}
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

          {/* Actions */}
          <div className="mt-3 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreview}
              className="h-7 text-xs gap-1"
              disabled={isPending}
            >
              <Eye className="h-3 w-3" />
              Preview
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRestore}
              className="h-7 text-xs gap-1 text-[var(--tertiary)] hover:text-[var(--tertiary)]"
              disabled={isPending}
            >
              <RotateCcw className="h-3 w-3" />
              Restore
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-7 text-xs gap-1 text-[var(--on-surface-variant)] hover:text-red-600"
              disabled={isPending}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VersionPreview({ version }: { version: ResumeVersion }) {
  const snapshot = version.snapshot as {
    title: string;
    templateId: string;
    blocks: Array<{
      blockType: string;
      headingOverride: string | null;
      isVisible: boolean;
      items: Array<unknown>;
    }>;
    summaryOverride: string | null;
  };

  return (
    <div className="rounded-lg bg-[var(--surface-container-low)] p-6">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--on-surface-variant)]">
          Title
        </p>
        <p className="text-sm">{snapshot.title}</p>
      </div>
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--on-surface-variant)]">
          Template
        </p>
        <p className="text-sm">{snapshot.templateId}</p>
      </div>
      {snapshot.summaryOverride && (
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--on-surface-variant)]">
            Summary
          </p>
          <p className="text-sm mt-1">{snapshot.summaryOverride}</p>
        </div>
      )}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--on-surface-variant)] mb-2">
          Sections ({snapshot.blocks.filter((b) => b.isVisible).length} visible)
        </p>
        <div className="space-y-1">
          {snapshot.blocks
            .filter((b) => b.isVisible)
            .map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm"
              >
                <span>
                  {b.headingOverride ||
                    b.blockType.charAt(0).toUpperCase() + b.blockType.slice(1)}
                </span>
                <span className="text-xs text-[var(--on-surface-variant)]">
                  {b.items.length} item{b.items.length !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
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
