"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  { value: "saved", label: "Saved", dot: "bg-gray-400" },
  { value: "applied", label: "Applied", dot: "bg-blue-500" },
  { value: "interviewing", label: "Interviewing", dot: "bg-[var(--tertiary)]" },
  { value: "offered", label: "Offered", dot: "bg-green-500" },
  { value: "rejected", label: "Rejected", dot: "bg-red-500" },
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
        <div className="rounded-lg bg-[var(--surface-container-lowest)] p-16 text-center shadow-ambient">
          <Briefcase className="mx-auto mb-4 h-16 w-16 text-[var(--on-surface-variant)] opacity-30" />
          <h2 className="font-headline text-lg font-bold text-[var(--on-surface)]">
            No applications yet
          </h2>
          <p className="mt-2 max-w-sm mx-auto text-sm text-[var(--on-surface-variant)]">
            Start tracking your job applications to see which resumes perform best.
          </p>
        </div>
      ) : (
        /* Kanban columns */
        <div className="flex gap-5 overflow-x-auto pb-4">
          {columns
            .filter((col) => col.apps.length > 0)
            .map((col) => (
              <div key={col.value} className="w-72 shrink-0">
                {/* Column header */}
                <div className="mb-3 flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
                    {col.label}
                  </h3>
                  <span className="text-xs text-[var(--on-surface-variant)]">
                    {col.apps.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {col.apps.map((app) => (
                    <div
                      key={app.id}
                      className="rounded-lg bg-[var(--surface-container-lowest)] p-4 shadow-ambient transition-all hover:translate-y-[-1px]"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[var(--on-surface)]">
                            {app.position}
                          </p>
                          <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">
                            {app.company}
                          </p>
                        </div>
                        <form action={() => deleteApplication(app.id)}>
                          <button className="text-[var(--on-surface-variant)] hover:text-[var(--destructive)] opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </div>
                      {app.appliedDate && (
                        <p className="mt-2 text-[0.65rem] text-[var(--on-surface-variant)]">
                          Applied {new Date(app.appliedDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      )}
                      {/* Status switcher */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {COLUMNS.map((s) => (
                          <form key={s.value} action={() => updateApplicationStatus(app.id, s.value)}>
                            <button
                              type="submit"
                              className={`rounded-md px-2 py-0.5 text-[0.6rem] font-medium transition-all ${
                                app.status === s.value
                                  ? "bg-[var(--tertiary-fixed)] text-[var(--tertiary)]"
                                  : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]"
                              }`}
                            >
                              {s.label}
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
