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
import { Plus, Trash2, FolderGit2 } from "lucide-react";
import { createProject, deleteProject } from "./actions";
import type { Project, ProjectBullet } from "@/db/schema";

type ProjectWithBullets = Project & {
  bullets: ProjectBullet[];
};

export function ProjectsSection({
  projects,
}: {
  projects: ProjectWithBullets[];
}) {
  const [open, setOpen] = useState(false);

  async function handleCreate(formData: FormData) {
    await createProject(formData);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">
            Personal or professional projects you want to showcase.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Project</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input id="url" name="url" placeholder="https://..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="technologies">
                  Technologies (comma-separated)
                </Label>
                <Input
                  id="technologies"
                  name="technologies"
                  placeholder="React, TypeScript, PostgreSQL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bullets">Key Points (one per line)</Label>
                <Textarea id="bullets" name="bullets" rows={4} />
              </div>
              <Button type="submit" className="w-full">
                Add Project
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderGit2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No projects added yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((proj) => (
            <Card key={proj.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{proj.name}</CardTitle>
                    {proj.description && (
                      <CardDescription>{proj.description}</CardDescription>
                    )}
                  </div>
                  <form action={() => deleteProject(proj.id)}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {proj.technologies.map((tech) => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
                {proj.bullets.length > 0 && (
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {proj.bullets.map((bullet) => (
                      <li key={bullet.id}>{bullet.text}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
