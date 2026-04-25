"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Briefcase } from "lucide-react";
import {
  createApplication,
  updateApplicationStatus,
  deleteApplication,
} from "./actions";
import type { JobApplication } from "@/db/schema";
import { useT } from "@/lib/i18n/context";

const COLUMN_VALUES = ["saved", "applied", "interviewing", "offered", "rejected"] as const;
const COLUMN_DOT: Record<string, string> = {
  saved: "#9aa0b1",
  applied: "#6d3cff",
  interviewing: "#d7a54a",
  offered: "#3ec28f",
  rejected: "#d24545",
};

export function ApplicationBoard({
  applications,
}: {
  applications: JobApplication[];
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const COLUMNS = COLUMN_VALUES.map((v) => ({
    value: v,
    label: t(`apps.col.${v}`),
    dot: COLUMN_DOT[v],
  }));

  async function handleCreate(formData: FormData) {
    await createApplication(formData);
    setOpen(false);
  }

  const columns = COLUMNS.map((col) => ({
    ...col,
    apps: applications.filter((a) => a.status === col.value),
  }));

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Input
            placeholder={t("apps.search_ph")}
            className="h-9 w-64 bg-[var(--surface-container-lowest)] border-ghost text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" className="magical-gradient text-white gap-2" />}>
              <Plus className="h-4 w-4" />
              {t("apps.add")}
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-headline">{t("apps.dialog_title")}</DialogTitle>
              </DialogHeader>
              <form action={handleCreate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company">{t("apps.field.company")}</Label>
                    <Input id="company" name="company" required className="border-ghost bg-[var(--surface-container-lowest)]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">{t("apps.field.position")}</Label>
                    <Input id="position" name="position" required className="border-ghost bg-[var(--surface-container-lowest)]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobUrl">{t("apps.field.url")}</Label>
                  <Input id="jobUrl" name="jobUrl" placeholder="https://..." className="border-ghost bg-[var(--surface-container-lowest)]" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="appliedDate">{t("apps.field.applied_date")}</Label>
                    <Input id="appliedDate" name="appliedDate" type="date" className="border-ghost bg-[var(--surface-container-lowest)]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryRange">{t("apps.field.salary")}</Label>
                    <Input id="salaryRange" name="salaryRange" placeholder={t("apps.field.salary_ph")} className="border-ghost bg-[var(--surface-container-lowest)]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t("apps.field.notes")}</Label>
                  <Textarea id="notes" name="notes" rows={3} className="border-ghost bg-[var(--surface-container-lowest)]" />
                </div>
                <input type="hidden" name="status" value="applied" />
                <Button type="submit" className="w-full magical-gradient text-white">
                  {t("apps.add")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-2xl bg-[var(--surface-raised)] p-16 text-center shadow-[var(--sh-1)]">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-[14px] bg-[var(--surface-sunk)]">
            <Briefcase className="h-6 w-6 text-[var(--on-surface-soft)]" />
          </div>
          <h2 className="font-headline mt-5 text-2xl font-normal">
            {t("apps.empty.title.part1")}{" "}
            <em className="serif-ital">{t("apps.empty.title.italic")}</em>.
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--on-surface-muted)]">
            {t("apps.empty.lead")}
          </p>
        </div>
      ) : (
        /* Kanban columns */
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          {columns.map((col) => (
            <div
              key={col.value}
              className="rounded-2xl bg-[var(--surface-raised)] p-4 shadow-[var(--sh-1)]"
            >
              {/* Column header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: col.dot }}
                  />
                  <h3 className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--on-surface-soft)]">
                    {col.label}
                  </h3>
                </div>
                <span className="font-mono text-[12px] text-[var(--on-surface-muted)]">
                  {col.apps.length.toString().padStart(2, "0")}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {col.apps.length === 0 && (
                  <div className="rounded-[8px] py-6 text-center text-[12px] text-[var(--on-surface-faint)]">
                    {t("apps.col.empty")}
                  </div>
                )}
                {col.apps.map((app) => (
                  <div
                    key={app.id}
                    className="group rounded-[8px] bg-[var(--surface)] p-3 shadow-[var(--sh-1)] transition-transform hover:-translate-y-px"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-[var(--on-surface)]">
                          {app.company}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-[var(--on-surface-muted)]">
                          {app.position}
                        </p>
                      </div>
                      <form action={() => deleteApplication(app.id)}>
                        <button
                          type="submit"
                          className="rounded p-1 text-[var(--on-surface-muted)] opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--surface-sunk)] hover:text-[var(--destructive)]"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: col.dot }}
                      />
                      <span className="font-mono text-[11px] text-[var(--on-surface-muted)]">
                        {app.appliedDate
                          ? new Date(app.appliedDate + "T00:00:00").toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )
                          : "—"}
                      </span>
                    </div>
                    {/* Status switcher */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {COLUMNS.filter((s) => s.value !== app.status).map((s) => (
                        <form
                          key={s.value}
                          action={() => updateApplicationStatus(app.id, s.value)}
                        >
                          <button
                            type="submit"
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-[var(--on-surface-muted)] transition-colors hover:bg-[var(--magic-tint)] hover:text-[var(--magic-1)]"
                          >
                            → {s.label}
                          </button>
                        </form>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
