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
import { Plus, Trash2, FolderGit2 } from "lucide-react";
import { createProject, deleteProject } from "./actions";
import type { Project, ProjectBullet } from "@/db/schema";

type ProjectWithBullets = Project & { bullets: ProjectBullet[] };

export function ProjectsSection({ projects }: { projects: ProjectWithBullets[] }) {
  const [open, setOpen] = useState(false);

  async function handleCreate(formData: FormData) {
    await createProject(formData);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-[26px] font-normal tracking-[-0.015em]">
            <em className="serif-ital">Projects</em>
          </h2>
          <p className="mt-0.5 text-sm text-[var(--on-surface-muted)]">
            Side builds, open source, portfolio pieces.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button size="sm" className="magical-gradient magic-shine h-9 rounded-full px-4" />
            }
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add project
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-[22px] border-0 bg-[var(--surface-raised)] shadow-[var(--sh-4),0_0_0_1px_var(--border-ghost)]">
            <DialogHeader>
              <DialogTitle className="font-headline text-[22px] font-normal tracking-[-0.01em]">
                Add <em className="serif-ital">project</em>
              </DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs text-[var(--on-surface-muted)]">
                    Project name
                  </Label>
                  <Input id="name" name="name" required className="resumi-input" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="url" className="text-xs text-[var(--on-surface-muted)]">
                    URL
                  </Label>
                  <Input id="url" name="url" placeholder="https://…" className="resumi-input" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs text-[var(--on-surface-muted)]">
                  Description
                </Label>
                <Textarea id="description" name="description" rows={2} className="resumi-input" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="technologies" className="text-xs text-[var(--on-surface-muted)]">
                  Technologies (comma-separated)
                </Label>
                <Input
                  id="technologies"
                  name="technologies"
                  placeholder="React, TypeScript, PostgreSQL"
                  className="resumi-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bullets" className="text-xs text-[var(--on-surface-muted)]">
                  Key points (one per line)
                </Label>
                <Textarea id="bullets" name="bullets" rows={4} className="resumi-input" />
              </div>
              <Button type="submit" className="magical-gradient magic-shine h-11 w-full rounded-full">
                Add project
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="resumi-card flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-[12px] bg-[var(--surface-sunk)]">
            <FolderGit2 className="h-5 w-5 text-[var(--on-surface-muted)]" />
          </div>
          <p className="text-[var(--on-surface-muted)]">No projects added yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((proj) => (
            <div key={proj.id} className="resumi-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium text-[var(--on-surface)]">{proj.name}</h3>
                  {proj.description && (
                    <p className="mt-0.5 text-sm text-[var(--on-surface-muted)]">
                      {proj.description}
                    </p>
                  )}
                </div>
                <form action={() => deleteProject(proj.id)}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-[8px] text-[var(--on-surface-muted)] hover:bg-[var(--surface-sunk)] hover:text-[var(--destructive)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
              {proj.technologies && proj.technologies.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {proj.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="font-mono rounded-full bg-[var(--surface-sunk)] px-2.5 py-0.5 text-[11px] text-[var(--on-surface-soft)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
              {proj.bullets.length > 0 && (
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--on-surface-soft)]">
                  {proj.bullets.map((bullet) => (
                    <li key={bullet.id}>{bullet.text}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
