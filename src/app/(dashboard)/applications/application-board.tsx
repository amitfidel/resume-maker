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
import { Plus, Trash2, Briefcase, Sparkles } from "lucide-react";
import {
  createApplication,
  updateApplicationStatus,
  deleteApplication,
} from "./actions";
import type { JobApplication } from "@/db/schema";

const COLUMNS = [
  { value: "saved", label: "Saved", dot: "#9aa0b1" },
  { value: "applied", label: "Applied", dot: "#6d3cff" },
  { value: "interviewing", label: "Interviewing", dot: "#d7a54a" },
  { value: "offered", label: "Offered", dot: "#3ec28f" },
  { value: "rejected", label: "Rejected", dot: "#d24545" },
];

export function ApplicationBoard({
  applications,
}: {
  applications: JobApplication[];
}) {
  const [open, setOpen] = useState(false);

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
            placeholder="Search applications..."
            className="h-9 w-64 bg-[var(--surface-container-lowest)] border-ghost text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="magical-surface text-white gap-2 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Magic Sync
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" className="magical-gradient text-white gap-2" />}>
              <Plus className="h-4 w-4" />
              Add Application
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-headline">Track a Job Application</DialogTitle>
              </DialogHeader>
              <form action={handleCreate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" name="company" required className="border-ghost bg-[var(--surface-container-lowest)]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input id="position" name="position" required className="border-ghost bg-[var(--surface-container-lowest)]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobUrl">Job URL</Label>
                  <Input id="jobUrl" name="jobUrl" placeholder="https://..." className="border-ghost bg-[var(--surface-container-lowest)]" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="appliedDate">Applied Date</Label>
                    <Input id="appliedDate" name="appliedDate" type="date" className="border-ghost bg-[var(--surface-container-lowest)]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryRange">Salary Range</Label>
                    <Input id="salaryRange" name="salaryRange" placeholder="$120k - $150k" className="border-ghost bg-[var(--surface-container-lowest)]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={3} className="border-ghost bg-[var(--surface-container-lowest)]" />
                </div>
                <input type="hidden" name="status" value="applied" />
                <Button type="submit" className="w-full magical-gradient text-white">
                  Add Application
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
            The pipeline starts <em className="serif-ital">here</em>.
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--on-surface-muted)]">
            Track applications to see which resume versions land interviews.
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
                    Empty
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
