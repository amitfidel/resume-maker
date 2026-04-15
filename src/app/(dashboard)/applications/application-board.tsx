"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Briefcase } from "lucide-react";
import {
  createApplication,
  updateApplicationStatus,
  deleteApplication,
} from "./actions";
import type { JobApplication } from "@/db/schema";

const STATUSES = [
  { value: "saved", label: "Saved", color: "bg-gray-100 text-gray-700" },
  { value: "applied", label: "Applied", color: "bg-blue-100 text-blue-700" },
  {
    value: "interviewing",
    label: "Interviewing",
    color: "bg-purple-100 text-purple-700",
  },
  {
    value: "offered",
    label: "Offered",
    color: "bg-green-100 text-green-700",
  },
  {
    value: "rejected",
    label: "Rejected",
    color: "bg-red-100 text-red-700",
  },
  {
    value: "withdrawn",
    label: "Withdrawn",
    color: "bg-amber-100 text-amber-700",
  },
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

  // Group by status for kanban columns
  const columns = STATUSES.map((status) => ({
    ...status,
    apps: applications.filter((a) => a.status === status.value),
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Add Application
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Track a Job Application</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input id="position" name="position" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobUrl">Job URL</Label>
                <Input
                  id="jobUrl"
                  name="jobUrl"
                  placeholder="https://..."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="appliedDate">Applied Date</Label>
                  <Input id="appliedDate" name="appliedDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryRange">Salary Range</Label>
                  <Input
                    id="salaryRange"
                    name="salaryRange"
                    placeholder="$120k - $150k"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>
              <input type="hidden" name="status" value="applied" />
              <Button type="submit" className="w-full">
                Add Application
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h2 className="text-lg font-semibold">No applications yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Start tracking your job applications to see which resumes perform
              best.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {columns
            .filter((col) => col.apps.length > 0)
            .map((col) => (
              <div key={col.value}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {col.apps.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {col.apps.map((app) => (
                    <ApplicationCard key={app.id} app={app} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ app }: { app: JobApplication }) {
  const statusInfo = STATUSES.find((s) => s.value === app.status);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm">{app.position}</CardTitle>
            <CardDescription>{app.company}</CardDescription>
          </div>
          <form action={() => deleteApplication(app.id)}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <form key={s.value} action={() => updateApplicationStatus(app.id, s.value)}>
              <button
                type="submit"
                className={`rounded-full px-2 py-0.5 text-xs font-medium transition-opacity ${
                  s.color
                } ${app.status === s.value ? "opacity-100 ring-1 ring-offset-1" : "opacity-40 hover:opacity-70"}`}
              >
                {s.label}
              </button>
            </form>
          ))}
        </div>
        {app.appliedDate && (
          <p className="mt-2 text-xs text-muted-foreground">
            Applied {new Date(app.appliedDate + "T00:00:00").toLocaleDateString()}
          </p>
        )}
        {app.notes && (
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {app.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
