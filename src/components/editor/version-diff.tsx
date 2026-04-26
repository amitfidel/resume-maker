"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  Minus,
  Pencil,
  ArrowUpDown,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getVersionDiff,
  getResumeVersions,
} from "@/app/(dashboard)/resumes/actions";
import { useT } from "@/lib/i18n/context";
import type {
  SnapshotDiff,
  FieldChange,
  ItemChange,
} from "@/lib/resume/diff";
import type { ResumeVersion } from "@/db/schema";

type Props = {
  resumeId: string;
  versionId: string;
  versionNumber: number;
};

/**
 * "Compare" view rendered inside the version-history dialog. Defaults
 * to comparing the chosen version against the live resume — the most
 * useful framing for the common case of "what would change if I
 * restore this?".
 */
export function VersionDiff({ resumeId, versionId, versionNumber }: Props) {
  const t = useT();
  const [compareWith, setCompareWith] = useState<string | "current">("current");
  const [otherVersions, setOtherVersions] = useState<ResumeVersion[]>([]);
  const [diff, setDiff] = useState<{
    leftLabel: string;
    rightLabel: string;
    diff: SnapshotDiff;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResumeVersions(resumeId).then((vs) => {
      // Exclude the version we're already inspecting from the picker.
      setOtherVersions(vs.filter((v) => v.id !== versionId));
    });
  }, [resumeId, versionId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVersionDiff(
      resumeId,
      versionId,
      compareWith === "current" ? null : compareWith,
    ).then((r) => {
      if (cancelled || !r) return;
      setDiff({
        leftLabel: r.leftLabel,
        rightLabel: r.rightLabel,
        diff: r.diff,
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [resumeId, versionId, compareWith]);

  return (
    <div className="space-y-4">
      {/* Compare-against picker */}
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className="text-[var(--on-surface-muted)]">{t("diff.comparing")}</span>
        <span className="rounded-full bg-[var(--surface-sunk)] px-2.5 py-1 font-mono text-[12px]">
          v{versionNumber}
        </span>
        <span className="text-[var(--on-surface-muted)]">{t("diff.against")}</span>
        <select
          value={compareWith}
          onChange={(e) => setCompareWith(e.target.value)}
          className="rounded-full border-0 bg-[var(--surface-sunk)] px-2.5 py-1 text-[12px] outline-none ring-1 ring-[var(--border-ghost)] focus:ring-2 focus:ring-[var(--magic-2)]"
        >
          <option value="current">{t("diff.current")}</option>
          {otherVersions.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.versionNumber}
              {v.changeSummary ? ` — ${v.changeSummary.slice(0, 30)}` : ""}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--on-surface-muted)]" />
        </div>
      )}

      {!loading && diff && !diff.diff.hasAnyChange && (
        <div className="rounded-[12px] bg-[var(--surface-sunk)] p-8 text-center text-[14px] text-[var(--on-surface-muted)]">
          {t("diff.no_changes")}
        </div>
      )}

      {!loading && diff && diff.diff.hasAnyChange && (
        <div className="space-y-4">
          {/* Top-level resume changes */}
          {diff.diff.resumeChanges.length > 0 && (
            <DiffGroup heading={t("diff.group.resume")}>
              {diff.diff.resumeChanges.map((c, i) => (
                <FieldRow key={i} change={c} t={t} />
              ))}
            </DiffGroup>
          )}

          {/* Added blocks */}
          {diff.diff.blocksAdded.map((b) => (
            <DiffGroup
              key={`added-${b.blockKey}`}
              heading={b.heading}
              tone="added"
              tagText={t("diff.added")}
            >
              {b.itemChanges.length === 0 ? (
                <p className="text-[12px] text-[var(--on-surface-muted)]">
                  {t("diff.empty_section")}
                </p>
              ) : (
                b.itemChanges.map((ic, i) => (
                  <ItemRow key={i} item={ic} t={t} forceKind="item-added" />
                ))
              )}
            </DiffGroup>
          ))}

          {/* Removed blocks */}
          {diff.diff.blocksRemoved.map((b) => (
            <DiffGroup
              key={`removed-${b.blockKey}`}
              heading={b.heading}
              tone="removed"
              tagText={t("diff.removed")}
            >
              {b.itemChanges.length === 0 ? (
                <p className="text-[12px] text-[var(--on-surface-muted)]">
                  {t("diff.empty_section")}
                </p>
              ) : (
                b.itemChanges.map((ic, i) => (
                  <ItemRow key={i} item={ic} t={t} forceKind="item-removed" />
                ))
              )}
            </DiffGroup>
          ))}

          {/* Modified blocks */}
          {diff.diff.blocks.map((b) => (
            <DiffGroup
              key={`changed-${b.blockKey}`}
              heading={b.heading}
              tone="changed"
            >
              {b.changes.map((c, i) => (
                <FieldRow key={`fc-${i}`} change={c} t={t} />
              ))}
              {b.itemChanges.map((ic, i) => (
                <ItemRow key={`ic-${i}`} item={ic} t={t} />
              ))}
            </DiffGroup>
          ))}
        </div>
      )}

      {/* Footer legend */}
      {!loading && diff && diff.diff.hasAnyChange && (
        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border-ghost)] pt-3 text-[11px] text-[var(--on-surface-muted)]">
          <Legend tone="added" label={t("diff.legend.added")} />
          <Legend tone="removed" label={t("diff.legend.removed")} />
          <Legend tone="changed" label={t("diff.legend.changed")} />
          <span className="ms-auto">
            {diff.leftLabel} → {diff.rightLabel}
          </span>
        </div>
      )}
    </div>
  );
}

function DiffGroup({
  heading,
  tone,
  tagText,
  children,
}: {
  heading: string;
  tone?: "added" | "removed" | "changed";
  tagText?: string;
  children: React.ReactNode;
}) {
  const ringColor =
    tone === "added"
      ? "ring-[var(--success)]/30"
      : tone === "removed"
        ? "ring-[var(--destructive)]/30"
        : "ring-[var(--border-ghost)]";

  const tagColor =
    tone === "added"
      ? "bg-[var(--success)]/15 text-[var(--success)]"
      : tone === "removed"
        ? "bg-[var(--destructive)]/15 text-[var(--destructive)]"
        : "";

  return (
    <div
      className={`rounded-[14px] bg-[var(--surface-raised)] p-4 ring-1 ${ringColor}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-headline text-[15px] tracking-[-0.005em] text-[var(--on-surface)]">
          {heading}
        </h4>
        {tagText && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] ${tagColor}`}>
            {tagText}
          </span>
        )}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function FieldRow({
  change,
  t,
}: {
  change: FieldChange;
  t: (k: string) => string;
}) {
  const Icon =
    change.kind === "field-added"
      ? Plus
      : change.kind === "field-removed"
        ? Minus
        : Pencil;
  const iconColor =
    change.kind === "field-added"
      ? "text-[var(--success)]"
      : change.kind === "field-removed"
        ? "text-[var(--destructive)]"
        : "text-[var(--on-surface-muted)]";

  // Special-case visibility — show eye icons.
  if (change.field === "visibility") {
    return (
      <div className="flex items-center gap-2 text-[13px]">
        {change.after ? (
          <Eye className="h-3.5 w-3.5 text-[var(--success)]" />
        ) : (
          <EyeOff className="h-3.5 w-3.5 text-[var(--on-surface-muted)]" />
        )}
        <span className="text-[var(--on-surface)]">
          {change.after ? t("diff.shown") : t("diff.hidden")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 text-[13px]">
      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${iconColor}`} />
      <div className="min-w-0 flex-1">
        <div className="text-[12px] uppercase tracking-[0.08em] text-[var(--on-surface-muted)]">
          {change.field}
        </div>
        <ValueDelta change={change} />
      </div>
    </div>
  );
}

function ValueDelta({ change }: { change: FieldChange }) {
  if (change.kind === "field-added") {
    return (
      <div className="rounded-[6px] bg-[var(--success)]/10 px-2 py-1 text-[12px] text-[var(--on-surface)]">
        + {formatValue(change.after)}
      </div>
    );
  }
  if (change.kind === "field-removed") {
    return (
      <div className="rounded-[6px] bg-[var(--destructive)]/10 px-2 py-1 text-[12px] line-through text-[var(--on-surface-muted)]">
        − {formatValue(change.before)}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <div className="rounded-[6px] bg-[var(--destructive)]/10 px-2 py-1 text-[12px] line-through text-[var(--on-surface-muted)]">
        {formatValue(change.before)}
      </div>
      <div className="rounded-[6px] bg-[var(--success)]/10 px-2 py-1 text-[12px] text-[var(--on-surface)]">
        {formatValue(change.after)}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  t,
  forceKind,
}: {
  item: ItemChange;
  t: (k: string) => string;
  forceKind?: ItemChange["kind"];
}) {
  const kind = forceKind ?? item.kind;
  const Icon =
    kind === "item-added"
      ? Plus
      : kind === "item-removed"
        ? Minus
        : kind === "item-reordered"
          ? ArrowUpDown
          : Pencil;
  const iconColor =
    kind === "item-added"
      ? "text-[var(--success)]"
      : kind === "item-removed"
        ? "text-[var(--destructive)]"
        : kind === "item-reordered"
          ? "text-[var(--magic-1)]"
          : "text-[var(--on-surface-muted)]";

  return (
    <div className="rounded-[8px] bg-[var(--surface-sunk)] p-2.5">
      <div className="flex items-center gap-2 text-[13px]">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
        <span className="font-medium text-[var(--on-surface)]">{item.label}</span>
        {kind === "item-reordered" && (
          <span className="text-[11px] text-[var(--on-surface-muted)]">
            {t("diff.reordered.from")} #{(item.beforeSortOrder ?? 0) + 1}
            {" → "}
            #{(item.afterSortOrder ?? 0) + 1}
          </span>
        )}
      </div>
      {item.changes.length > 0 && (
        <div className="ms-5 mt-1.5 space-y-1">
          {item.changes.map((c, i) => (
            <FieldRow key={i} change={c} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function Legend({ tone, label }: { tone: "added" | "removed" | "changed"; label: string }) {
  const dot =
    tone === "added"
      ? "bg-[var(--success)]"
      : tone === "removed"
        ? "bg-[var(--destructive)]"
        : "bg-[var(--magic-2)]";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v.length > 200 ? v.slice(0, 200) + "…" : v;
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  // Objects / arrays — JSON-stringify, capped.
  const s = JSON.stringify(v);
  return s.length > 200 ? s.slice(0, 200) + "…" : s;
}
